import { getRadioIndex } from "@/lib/radio/browser";
import type { RadioStation, RadioTag } from "@/types/radio";

/**
 * Public shape: the raw URL plus how a browser should actually reach it.
 *
 * A good share of the index is still served over plain HTTP, which a page on
 * HTTPS cannot load at all. Those are marked `direct: null` so the client falls
 * back to the proxy instead of firing a request the browser will block.
 */
export type RadioStationPublic = RadioStation & {
  direct: string | null;
  proxy_url: string;
};

function toPublic(station: RadioStation): RadioStationPublic {
  return {
    ...station,
    direct: station.stream.startsWith("https:") ? station.stream : null,
    proxy_url: `/api/v1/radio/stations/${station.id}/stream`,
  };
}

export const radioStations = async (options: { tag?: string; q?: string } = {}) => {
  const { stations } = await getRadioIndex();
  const tag = options.tag?.toLowerCase();
  const query = options.q?.toLowerCase();

  const filtered = stations.filter((station) => {
    if (tag && !station.tags.includes(tag)) return false;
    if (query) {
      const haystack = `${station.name} ${station.state ?? ""}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  return { total: filtered.length, stations: filtered.map(toPublic) };
};

export const radioStation = async (id: string): Promise<RadioStationPublic | null> => {
  const { byId } = await getRadioIndex();
  const station = byId.get(id);
  return station ? toPublic(station) : null;
};

export const radioTags = async (): Promise<RadioTag[]> => {
  const { stations } = await getRadioIndex();
  const counts = new Map<string, number>();

  for (const station of stations) {
    for (const tag of station.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, count }))
    // A tag used by one station is noise in a filter bar.
    .filter((tag) => tag.count >= 3)
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug))
    .slice(0, 40);
};
