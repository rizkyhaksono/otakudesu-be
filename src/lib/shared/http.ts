import { NotFoundError, UpstreamError } from "@/lib/shared/errors";

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_UA =
  "Mozilla/5.0 (compatible; otakudesu-be/3.0; +https://github.com/rizkyhaksono/otakudesu-be)";

export type FetchOptions = {
  /** Seconds to keep the response in the in-memory cache. `0`/unset disables caching. */
  revalidate?: number;
  headers?: Record<string, string>;
  timeoutMs?: number;
  /** Retries on 5xx / network failure. Defaults to 1 (so 2 attempts total). */
  retries?: number;
  signal?: AbortSignal;
  /** Defaults to GET. A body only makes sense with POST/PUT. */
  method?: "GET" | "POST" | "PUT";
  body?: BodyInit | Uint8Array;
};

type CacheEntry = { body: Uint8Array; status: number; contentType: string; expiresAt: number };

// shortcut: per-process memory, so every replica and restart starts cold; move to Redis if this runs >1 replica.
const MAX_CACHE_BYTES = 64 * 1024 * 1024;
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<CacheEntry>>();
let cacheBytes = 0;

function remember(key: string, entry: CacheEntry) {
  const previous = cache.get(key);
  if (previous) {
    cacheBytes -= previous.body.byteLength;
    cache.delete(key);
  }
  if (entry.body.byteLength > MAX_CACHE_BYTES / 8) return; // one huge document must not flush everything else
  cache.set(key, entry);
  cacheBytes += entry.body.byteLength;
  // Map keeps insertion order, and hits are re-inserted, so the first key is the least recently used.
  for (const [oldest, value] of cache) {
    if (cacheBytes <= MAX_CACHE_BYTES) break;
    cache.delete(oldest);
    cacheBytes -= value.body.byteLength;
  }
}

const toResponse = (entry: CacheEntry) =>
  new Response(entry.body.slice(), {
    status: entry.status,
    headers: { "Content-Type": entry.contentType },
  });

/** Test hook. */
export function __resetHttpCache() {
  cache.clear();
  inflight.clear();
  cacheBytes = 0;
}

/**
 * Single I/O boundary for the whole API, and its cache.
 *
 * GETs with `revalidate > 0` are cached in memory for that many seconds.
 * Concurrent misses for one URL share a single upstream request, and when a
 * refresh fails the expired copy is served instead — an upstream outage then
 * degrades to slightly old data rather than an error.
 */
async function request(url: string, options: FetchOptions = {}): Promise<Response> {
  const { revalidate, method } = options;
  if (!revalidate || revalidate <= 0 || (method && method !== "GET")) return send(url, options);

  const hit = cache.get(url);
  if (hit && hit.expiresAt > Date.now()) {
    remember(url, hit);
    return toResponse(hit);
  }

  let pending = inflight.get(url);
  if (!pending) {
    pending = send(url, options)
      .then(async (response) => {
        const entry: CacheEntry = {
          body: new Uint8Array(await response.arrayBuffer()),
          status: response.status,
          contentType: response.headers.get("content-type") ?? "application/octet-stream",
          expiresAt: Date.now() + revalidate * 1000,
        };
        remember(url, entry);
        return entry;
      })
      .finally(() => inflight.delete(url));
    inflight.set(url, pending);
  }

  try {
    return toResponse(await pending);
  } catch (error) {
    // A real 404 means the page is gone; anything else falls back to the stale copy.
    if (hit && !(error instanceof NotFoundError)) return toResponse(hit);
    throw error;
  }
}

async function send(url: string, options: FetchOptions): Promise<Response> {
  const {
    revalidate,
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = 1,
    signal,
    method,
    body,
  } = options;

  const init: RequestInit = {
    headers: {
      "User-Agent": DEFAULT_UA,
      "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
      ...headers,
    },
    redirect: "follow",
    ...(method ? { method } : {}),
    // Uint8Array is a valid fetch body at runtime; the DOM lib's BodyInit type
    // just doesn't say so in this TS configuration.
    ...(body !== undefined ? { body: body as BodyInit } : {}),
  };

  if (revalidate === 0) init.cache = "no-store";

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const composed = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

    try {
      const response = await fetch(url, { ...init, signal: composed });

      // 5xx is worth another attempt; 4xx is not.
      if (response.status >= 500 && attempt < retries) {
        lastError = UpstreamError.failed(url, response.status);
        continue;
      }

      if (!response.ok) {
        throw UpstreamError.failed(url, response.status);
      }

      return response;
    } catch (error) {
      // `UpstreamError.failed` maps an upstream 404 to NotFoundError; let it through as-is.
      if (error instanceof UpstreamError || error instanceof NotFoundError) throw error;
      lastError = asUpstreamFailure(url, error);
      if (attempt >= retries) break;
    }
  }

  if (lastError instanceof UpstreamError) throw lastError;
  throw asUpstreamFailure(url, lastError);
}

function asUpstreamFailure(url: string, error: unknown): UpstreamError {
  if (error instanceof UpstreamError) return error;
  // AbortSignal.timeout rejects with TimeoutError; some runtimes surface AbortError.
  if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
    return UpstreamError.timeout(url);
  }
  return new UpstreamError(`Upstream request failed: ${url}`);
}

/** Fetch upstream HTML. */
export async function fetchHtml(url: string, options: FetchOptions = {}): Promise<string> {
  const response = await request(url, {
    ...options,
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      ...options.headers,
    },
  });
  try {
    return await response.text();
  } catch (error) {
    throw asUpstreamFailure(url, error);
  }
}

/** Fetch and parse an upstream JSON document. */
export async function fetchJson<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const response = await request(url, {
    ...options,
    headers: { Accept: "application/json", ...options.headers },
  });
  try {
    return (await response.json()) as T;
  } catch (error) {
    throw asUpstreamFailure(url, error);
  }
}

/** Escape hatch for callers that need the raw `Response` (e.g. the HLS proxy). */
export { request as fetchRaw };

/** Join a base URL with a path, tolerating slashes on either side. */
export function joinUrl(base: string, path: string): string {
  if (!path) return base;
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
