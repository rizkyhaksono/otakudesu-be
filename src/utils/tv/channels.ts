import { getIndex } from "@/lib/tv/iptv";
import type { TvCategory, TvChannel, TvChannelPublic } from "@/types/tv";

/**
 * Streams carry `user_agent` / `referrer` values that exist purely so our proxy
 * can replay them upstream. They are stripped here so they never reach a client.
 */
export function toPublic(channel: TvChannel): TvChannelPublic {
  const { streams, ...rest } = channel;

  return {
    ...rest,
    streams: streams
      .map((stream, index) => ({ stream, index }))
      .filter(({ stream }) => stream.alive !== false)
      .map(({ stream, index }) => ({
        quality: stream.quality,
        title: stream.title,
        // Direct playback is only offered when no custom headers are required.
        url: stream.needs_proxy ? null : stream.url,
        proxy_url: `/api/v1/tv/channels/${channel.id}/stream?s=${index}`,
      })),
  };
}

/**
 * A channel is hidden once every one of its streams has been *proven* dead by
 * the background liveness pass. Streams that have not been probed yet
 * (`alive === null`) keep the channel visible, so a slow first sweep never
 * empties the listing.
 */
function hasPlayableStream(channel: TvChannel): boolean {
  return channel.streams.some((stream) => stream.alive !== false);
}

export const tvChannels = async (options: { category?: string; q?: string } = {}) => {
  const { channels } = await getIndex();
  const category = options.category?.toLowerCase();
  const query = options.q?.toLowerCase();

  const filtered = channels.filter((channel) => {
    if (!hasPlayableStream(channel)) return false;
    if (category && !channel.categories.some((c) => c.toLowerCase() === category)) return false;
    if (query) {
      const haystack = [channel.name, ...channel.alt_names, channel.network ?? ""]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  return { total: filtered.length, channels: filtered.map(toPublic) };
};

export const tvChannel = async (id: string): Promise<TvChannelPublic | null> => {
  const { byId } = await getIndex();
  const channel = byId.get(id);
  return channel ? toPublic(channel) : null;
};

export const tvCategories = async (): Promise<TvCategory[]> => {
  const { channels } = await getIndex();
  const counts = new Map<string, number>();

  for (const channel of channels) {
    for (const category of channel.categories) {
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
};
