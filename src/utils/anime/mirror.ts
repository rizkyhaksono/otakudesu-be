import { load } from "cheerio";
import { getAnimeBaseUrl } from "@/lib/shared/env";
import { UpstreamError, ValidationError } from "@/lib/shared/errors";
import { url as safeUrl } from "@/lib/shared/sanitize";

/**
 * Resolve one mirror token into a playable iframe URL.
 *
 * The upstream exposes mirrors through two admin-ajax calls: fetch a nonce,
 * then exchange the mirror payload for a base64-encoded iframe. Both actions
 * are constants baked into the page's own script.
 *
 * The `content` token comes from the client, so it is decoded and shape-checked
 * before use. It only ever travels to our configured upstream, never to a
 * caller-supplied host, so this is not an SSRF surface.
 */

const NONCE_ACTION = "aa1208d27f29ca340c92c66d1926f13f";
const MIRROR_ACTION = "2a3505c93b0035d3f455df82bf976b84";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/** Nonces stay valid for a while; re-fetching one per mirror click is wasteful. */
let nonceCache: { value: string; at: number } | null = null;
const NONCE_TTL_MS = 10 * 60 * 1000;

type MirrorPayload = { id: number; i: number; q: string };

function decodeToken(content: string): MirrorPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(content, "base64").toString("utf8"));
  } catch {
    throw new ValidationError("Invalid mirror token");
  }

  const payload = parsed as Partial<MirrorPayload>;
  if (
    typeof payload?.id !== "number" ||
    !Number.isInteger(payload.id) ||
    typeof payload.i !== "number" ||
    !Number.isInteger(payload.i) ||
    typeof payload.q !== "string" ||
    payload.q.length > 16
  ) {
    throw new ValidationError("Invalid mirror token");
  }

  return { id: payload.id, i: payload.i, q: payload.q };
}

async function ajax(baseUrl: string, body: Record<string, string | number>) {
  const response = await fetch(`${baseUrl}/wp-admin/admin-ajax.php`, {
    method: "POST",
    headers: {
      "User-Agent": UA,
      "X-Requested-With": "XMLHttpRequest",
      Referer: `${baseUrl}/`,
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: new URLSearchParams(
      Object.fromEntries(Object.entries(body).map(([k, v]) => [k, String(v)])),
    ),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) throw UpstreamError.failed(baseUrl, response.status);
  return (await response.json()) as { data?: unknown };
}

async function getNonce(baseUrl: string): Promise<string> {
  const now = Date.now();
  if (nonceCache && now - nonceCache.at < NONCE_TTL_MS) return nonceCache.value;

  const result = await ajax(baseUrl, { action: NONCE_ACTION });
  const nonce = typeof result.data === "string" ? result.data : null;
  if (!nonce) throw new UpstreamError("Could not obtain a mirror nonce");

  nonceCache = { value: nonce, at: now };
  return nonce;
}

/**
 * Can this URL be shown in an iframe on a site that is not the upstream?
 *
 * Several mirrors (desustream.*) publish
 * `frame-ancestors 'self' https://otakudesu.blog`, which the browser enforces —
 * embedding them anywhere else yields a blank player no matter what we do. The
 * check is done here so the UI can offer "open in a new tab" for those instead
 * of showing a dead frame, and can default to a server that actually works.
 */
async function isEmbeddable(target: string): Promise<boolean> {
  try {
    const response = await fetch(target, {
      method: "GET",
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    await response.body?.cancel();

    const xfo = response.headers.get("x-frame-options")?.toLowerCase() ?? "";
    if (xfo.includes("deny") || xfo.includes("sameorigin")) return false;

    const csp = response.headers.get("content-security-policy") ?? "";
    const directive = /frame-ancestors([^;]*)/i.exec(csp)?.[1]?.toLowerCase();
    if (!directive) return true;

    // Token-based, not substring: `*.otakudesu.blog` contains "*" but permits
    // nothing of ours, so only a bare `*` token counts as open.
    return directive.trim().split(/\s+/).includes("*");
  } catch {
    // Unknown means "let the browser try" — better than hiding a working server.
    return true;
  }
}

const mirror = async (
  content: string,
): Promise<{ url: string; embeddable: boolean } | null> => {
  const baseUrl = getAnimeBaseUrl();
  const payload = decodeToken(content);

  const resolve = async (nonce: string) => {
    const result = await ajax(baseUrl, { ...payload, nonce, action: MIRROR_ACTION });
    return typeof result.data === "string" ? result.data : null;
  };

  let encoded = await resolve(await getNonce(baseUrl));

  // An expired nonce comes back as a non-string payload; refresh once and retry.
  if (!encoded) {
    nonceCache = null;
    encoded = await resolve(await getNonce(baseUrl));
  }
  if (!encoded) return null;

  const html = Buffer.from(encoded, "base64").toString("utf8");
  const src = load(html)("iframe").attr("src");
  const url = safeUrl(src);
  if (!url) return null;

  return { url, embeddable: await isEmbeddable(url) };
};

export default mirror;

/** Test seam. */
export function __resetNonce() {
  nonceCache = null;
}
