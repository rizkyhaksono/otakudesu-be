import { UpstreamError } from "@/lib/shared/errors";

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_UA =
  "Mozilla/5.0 (compatible; otakudesu-be/3.0; +https://github.com/rizkyhaksono/otakudesu-be)";

export type FetchOptions = {
  /** Seconds to keep the response in the Next.js Data Cache. `0` disables caching. */
  revalidate?: number;
  /** Cache tags for on-demand invalidation. */
  tags?: string[];
  headers?: Record<string, string>;
  timeoutMs?: number;
  /** Retries on 5xx / network failure. Defaults to 1 (so 2 attempts total). */
  retries?: number;
  signal?: AbortSignal;
  /** Defaults to GET. A body only makes sense with POST/PUT. */
  method?: "GET" | "POST" | "PUT";
  body?: BodyInit | Uint8Array;
};

/**
 * Single I/O boundary for the whole API.
 *
 * Native `fetch` rather than axios on purpose: Next.js only applies its Data
 * Cache and `revalidate` semantics to `fetch`, so this is what makes upstream
 * responses cacheable at all.
 */
async function request(url: string, options: FetchOptions = {}): Promise<Response> {
  const {
    revalidate,
    tags,
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = 1,
    signal,
    method,
    body,
  } = options;

  const init: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {
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

  if (revalidate === 0) {
    init.cache = "no-store";
  } else if (revalidate !== undefined || tags?.length) {
    init.next = {};
    if (revalidate !== undefined) init.next.revalidate = revalidate;
    if (tags?.length) init.next.tags = tags;
  }

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
      if (error instanceof UpstreamError) throw error;
      // AbortSignal.timeout rejects with a TimeoutError DOMException.
      if (error instanceof Error && error.name === "TimeoutError") {
        lastError = UpstreamError.timeout(url);
      } else {
        lastError = error;
      }
      if (attempt >= retries) break;
    }
  }

  if (lastError instanceof UpstreamError) throw lastError;
  throw new UpstreamError(`Upstream request failed: ${url}`);
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
  return response.text();
}

/** Fetch and parse an upstream JSON document. */
export async function fetchJson<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const response = await request(url, {
    ...options,
    headers: { Accept: "application/json", ...options.headers },
  });
  return response.json() as Promise<T>;
}

/** Escape hatch for callers that need the raw `Response` (e.g. the HLS proxy). */
export { request as fetchRaw };

/** Join a base URL with a path, tolerating slashes on either side. */
export function joinUrl(base: string, path: string): string {
  if (!path) return base;
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
