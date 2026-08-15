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

const mirror = async (content: string): Promise<{ url: string } | null> => {
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

  return url ? { url } : null;
};

export default mirror;

/** Test seam. */
export function __resetNonce() {
  nonceCache = null;
}
