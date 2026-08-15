import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { assertPublicUrl } from "@/lib/shared/ssrf";
import { ValidationError } from "@/lib/shared/errors";

/**
 * HLS manifests reference segments by URL, and those segments frequently live
 * on a different CDN host than the manifest itself. To proxy them we must put a
 * URL in the link we hand back to the browser — which would hand an attacker a
 * server-side fetch primitive (SSRF) if it were accepted verbatim.
 *
 * So every proxied URL is HMAC-signed by us. The browser can only ask for URLs
 * that this server already saw inside a manifest it fetched from the channel
 * index; a forged or mutated URL fails signature verification before any
 * network call happens. `assertPublicUrl` then runs as a second layer.
 *
 * The signing key is per-process by default: manifests are short-lived, so
 * there is nothing to gain from persisting it. Set `HLS_PROXY_SECRET` when
 * running multiple replicas behind a load balancer.
 */
const SECRET =
  process.env.HLS_PROXY_SECRET?.trim() || randomBytes(32).toString("hex");

export function sign(url: string): string {
  return createHmac("sha256", SECRET).update(url).digest("base64url").slice(0, 32);
}

export function verify(url: string, signature: string): boolean {
  const expected = Buffer.from(sign(url));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}

export function proxyUrl(channelId: string, streamIndex: number, target: string): string {
  const params = new URLSearchParams({
    s: String(streamIndex),
    u: target,
    sig: sign(target),
  });
  return `/api/v1/tv/channels/${channelId}/stream?${params.toString()}`;
}

/** Resolve a signed proxy target, rejecting anything we did not sign ourselves. */
export async function resolveSignedTarget(rawUrl: string, signature: string): Promise<URL> {
  if (!signature || !verify(rawUrl, signature)) {
    throw new ValidationError("Invalid stream signature");
  }
  return assertPublicUrl(rawUrl);
}

const URI_ATTRIBUTE = /URI="([^"]+)"/g;

/**
 * Rewrite every URI in an m3u8 so playback flows through this proxy: nested
 * variant playlists, media segments, and the `#EXT-X-KEY` / `#EXT-X-MAP`
 * attributes that would otherwise bypass it.
 */
export function rewriteManifest(
  manifest: string,
  manifestUrl: string,
  channelId: string,
  streamIndex: number,
): string {
  const toProxy = (reference: string): string => {
    const trimmed = reference.trim();
    if (!trimmed || trimmed.startsWith("#")) return reference;
    try {
      const absolute = new URL(trimmed, manifestUrl).toString();
      return proxyUrl(channelId, streamIndex, absolute);
    } catch {
      return reference;
    }
  };

  return manifest
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      if (trimmed.startsWith("#")) {
        // Attribute lists carry URIs too (encryption keys, init segments).
        return line.replace(URI_ATTRIBUTE, (_, uri: string) => `URI="${toProxy(uri)}"`);
      }

      return toProxy(trimmed);
    })
    .join("\n");
}

export function isManifest(contentType: string | null, url: string): boolean {
  if (contentType) {
    const normalized = contentType.toLowerCase();
    if (
      normalized.includes("mpegurl") ||
      normalized.includes("m3u8") ||
      normalized.includes("vnd.apple")
    ) {
      return true;
    }
  }
  return /\.m3u8(\?|$)/i.test(url);
}
