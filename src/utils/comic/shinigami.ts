import { getShinigamiPortalUrl } from "@/lib/shared/env";
import { fetchJson } from "@/lib/shared/http";
import { text, url as safeUrl } from "@/lib/shared/sanitize";
import type { MirrorLink, MirrorStatus } from "@/types/mirror";

/**
 * Shinigami's current domain, resolved from their own portal.
 *
 * Shinigami rotates its domain constantly (11.shinigami.asia today, a
 * different number tomorrow), which is exactly why a hardcoded link rots. They
 * publish the answer themselves: `shinigami.to` is a tiny SPA whose only job
 * is to fetch `/links.json`, and the **first** entry in that list is always the
 * live site — the rest are Discord, docs, premium and donation links.
 *
 * So this reads that list rather than guessing. `shinigami.to` is a stable
 * apex that stays put precisely because it is the redirector.
 *
 * What this deliberately does *not* do is scrape their catalogue: the content
 * domain sits behind a Cloudflare managed challenge (verified — a full browser
 * header set still gets a 403 interstitial), the same wall that got idlix
 * dropped. Beating it needs a headless browser with a stealth plugin running
 * as a separate service, which is heavy, slow and breaks on every Cloudflare
 * update. Pointing people at an always-correct link is the honest thing this
 * source can actually support.
 */

const TTL_MS = 30 * 60 * 1000;

type RawLink = { title?: string; href?: string; icon?: string };

let cached: { at: number; value: Promise<MirrorStatus> } | null = null;

function mapLink(raw: RawLink): MirrorLink | null {
  const title = text(raw.title);
  const href = safeUrl(raw.href);
  if (!title || !href) return null;
  return { title, href, icon: text(raw.icon) };
}

async function build(): Promise<MirrorStatus> {
  const raw = await fetchJson<RawLink[]>(`${getShinigamiPortalUrl()}/links.json`, {
    revalidate: TTL_MS / 1000,
    timeoutMs: 10_000,
  });

  const links = (Array.isArray(raw) ? raw : [])
    .map(mapLink)
    .filter((link): link is MirrorLink => link !== null);

  return {
    // Position, not title matching: the label is localised prose ("Link
    // Website") that they are free to reword, but the ordering convention —
    // live site first — is the contract this portal exists to express.
    current: links[0]?.href ?? null,
    links,
    checkedAt: new Date().toISOString(),
  };
}

export function shinigamiStatus(): Promise<MirrorStatus> {
  const now = Date.now();
  if (cached && now - cached.at < TTL_MS) return cached.value;

  const value = build().catch((error) => {
    // Never cache a failure: a rotation is exactly when this must retry.
    cached = null;
    throw error;
  });

  cached = { at: now, value };
  return value;
}

/** Test seam. */
export function __resetShinigami() {
  cached = null;
}
