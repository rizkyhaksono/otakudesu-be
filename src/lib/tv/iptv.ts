import { getIptvApiUrl, getTvCountry } from "@/lib/shared/env";
import { fetchJson } from "@/lib/shared/http";
import { num, text, url as safeUrl } from "@/lib/shared/sanitize";
import type { TvChannel, TvStream } from "@/types/tv";

/**
 * Live TV index built from the iptv-org open dataset — public JSON, no scraping.
 *
 * `channels.json` is ~10 MB and `guides.json` ~25 MB, so the raw documents are
 * fetched once, reduced to just the requested country, and memoised in module
 * scope for six hours. This runs as a long-lived Node server, so that memo
 * survives between requests and the big documents are never re-parsed per call.
 */

const INDEX_TTL_MS = 6 * 60 * 60 * 1000;

type RawChannel = {
  id?: string;
  name?: string;
  alt_names?: string[];
  network?: string | null;
  owners?: string[];
  country?: string;
  categories?: string[];
  is_nsfw?: boolean;
  launched?: string | null;
  closed?: string | null;
  website?: string | null;
};

type RawStream = {
  channel?: string | null;
  feed?: string | null;
  title?: string | null;
  url?: string;
  quality?: string | null;
  user_agent?: string | null;
  referrer?: string | null;
};

type RawLogo = { channel?: string | null; url?: string; width?: number; height?: number };

type Index = { channels: TvChannel[]; byId: Map<string, TvChannel> };

let cached: { at: number; value: Promise<Index> } | null = null;

export function getIndex(): Promise<Index> {
  const now = Date.now();
  if (cached && now - cached.at < INDEX_TTL_MS) return cached.value;

  const value = buildIndex().catch((error) => {
    // Never cache a failure — the next request should retry.
    cached = null;
    throw error;
  });

  cached = { at: now, value };
  return value;
}

async function buildIndex(): Promise<Index> {
  const base = getIptvApiUrl();
  const country = getTvCountry();

  // `cache: "no-store"`, not `revalidate`: these documents are 10 MB, 7 MB and
  // 3 MB, far past Next's 2 MB per-entry Data Cache limit. Asking Next to cache
  // them fails on every request, logs a warning, and re-downloads ~20 MB each
  // time. The module-level memo above is the real cache — it holds the *reduced*
  // index, which is a few hundred KB.
  const [rawChannels, rawStreams, rawLogos] = await Promise.all([
    fetchJson<RawChannel[]>(`${base}/channels.json`, { revalidate: 0, timeoutMs: 120_000 }),
    fetchJson<RawStream[]>(`${base}/streams.json`, { revalidate: 0, timeoutMs: 120_000 }),
    fetchJson<RawLogo[]>(`${base}/logos.json`, { revalidate: 0, timeoutMs: 120_000 }).catch(
      () => [] as RawLogo[],
    ),
  ]);

  const wanted = new Map<string, RawChannel>();
  for (const channel of rawChannels) {
    if (!channel.id || channel.country !== country) continue;
    if (channel.closed) continue;
    if (channel.is_nsfw) continue;
    wanted.set(channel.id, channel);
  }

  const streamsByChannel = new Map<string, TvStream[]>();
  for (const stream of rawStreams) {
    const channelId = stream.channel;
    if (!channelId || !wanted.has(channelId)) continue;

    const streamUrl = safeUrl(stream.url);
    if (!streamUrl) continue;

    const user_agent = text(stream.user_agent);
    const referrer = text(stream.referrer);

    const list = streamsByChannel.get(channelId) ?? [];
    list.push({
      url: streamUrl,
      quality: text(stream.quality),
      title: text(stream.title) ?? text(stream.feed),
      // A stream that requires custom headers can never be played directly from
      // the browser, so it must go through our proxy.
      needs_proxy: Boolean(user_agent || referrer),
      user_agent,
      referrer,
      alive: null,
    });
    streamsByChannel.set(channelId, list);
  }

  const logoByChannel = new Map<string, string>();
  for (const logo of rawLogos) {
    if (!logo.channel || logoByChannel.has(logo.channel)) continue;
    if (!wanted.has(logo.channel)) continue;
    const logoUrl = safeUrl(logo.url);
    if (logoUrl) logoByChannel.set(logo.channel, logoUrl);
  }

  const channels: TvChannel[] = [];
  for (const [id, raw] of wanted) {
    const streams = streamsByChannel.get(id);
    // Channels without a playable stream are dropped rather than shown broken.
    if (!streams?.length) continue;

    streams.sort((a, b) => qualityRank(b.quality) - qualityRank(a.quality));

    channels.push({
      id,
      name: text(raw.name) ?? id,
      alt_names: (raw.alt_names ?? []).map((n) => text(n)).filter((n): n is string => n !== null),
      network: text(raw.network),
      owners: (raw.owners ?? []).map((n) => text(n)).filter((n): n is string => n !== null),
      country: raw.country ?? country,
      categories: (raw.categories ?? [])
        .map((c) => text(c))
        .filter((c): c is string => c !== null),
      launched: text(raw.launched),
      website: safeUrl(raw.website),
      logo: logoByChannel.get(id) ?? null,
      streams,
    });
  }

  channels.sort((a, b) => a.name.localeCompare(b.name, "id"));

  const index = { channels, byId: new Map(channels.map((channel) => [channel.id, channel])) };

  // Probe liveness in the background so the first request is not blocked by
  // ~130 network round-trips. Streams are mutated in place, so once this
  // settles the dead ones disappear from listings on their own.
  void verifyStreams(index);

  return index;
}

const PROBE_CONCURRENCY = 12;
const PROBE_TIMEOUT_MS = 6000;

async function verifyStreams(index: Index): Promise<void> {
  const streams = index.channels.flatMap((channel) => channel.streams);
  let cursor = 0;

  const worker = async () => {
    while (cursor < streams.length) {
      const stream = streams[cursor++];
      if (!stream) return;
      stream.alive = await probe(stream);
    }
  };

  try {
    await Promise.all(
      Array.from({ length: Math.min(PROBE_CONCURRENCY, streams.length) }, worker),
    );
  } catch {
    // A failed sweep just leaves streams unverified; listings stay unfiltered.
  }
}

async function probe(stream: TvStream): Promise<boolean> {
  const headers: Record<string, string> = {
    "User-Agent":
      stream.user_agent ??
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    Accept: "*/*",
  };
  if (stream.referrer) headers.Referer = stream.referrer;

  try {
    const response = await fetch(stream.url, {
      headers,
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    // Drain so the socket is released promptly.
    await response.body?.cancel();
    return response.ok;
  } catch {
    return false;
  }
}

/** Sort 1080p ahead of 720p ahead of unknown. */
function qualityRank(quality: string | null): number {
  const parsed = num(quality);
  return parsed ?? 0;
}

/** Test seam. */
export function __resetIndex() {
  cached = null;
}
