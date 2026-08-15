import { getRadioApiUrl, getTvCountry } from "@/lib/shared/env";
import { fetchJson } from "@/lib/shared/http";
import { num, text, url as safeUrl } from "@/lib/shared/sanitize";
import type { RadioStation } from "@/types/radio";

/**
 * Indonesian radio from the radio-browser open database.
 *
 * Same shape as the live TV domain — a public index of third-party streams,
 * memoised and liveness-checked — so it reuses that architecture rather than
 * inventing a second one. The API already exposes a `lastcheckok` flag, which
 * saves us probing every station ourselves.
 */

const INDEX_TTL_MS = 6 * 60 * 60 * 1000;

type RawStation = {
  stationuuid?: string;
  name?: string;
  url_resolved?: string;
  url?: string;
  favicon?: string;
  tags?: string;
  codec?: string;
  bitrate?: number;
  clickcount?: number;
  votes?: number;
  homepage?: string;
  state?: string;
  language?: string;
  lastcheckok?: number;
};

type Index = { stations: RadioStation[]; byId: Map<string, RadioStation> };

let cached: { at: number; value: Promise<Index> } | null = null;

export function getRadioIndex(): Promise<Index> {
  const now = Date.now();
  if (cached && now - cached.at < INDEX_TTL_MS) return cached.value;

  const value = buildIndex().catch((error) => {
    cached = null;
    throw error;
  });

  cached = { at: now, value };
  return value;
}

async function buildIndex(): Promise<Index> {
  const country = getTvCountry();

  const raw = await fetchJson<RawStation[]>(
    // Ordered by popularity so the listing opens with stations people know.
    `${getRadioApiUrl()}/json/stations/bycountrycodeexact/${country}?hidebroken=true&order=clickcount&reverse=true`,
    { revalidate: 0, timeoutMs: 60_000 },
  );

  const stations: RadioStation[] = [];

  for (const entry of raw) {
    const id = text(entry.stationuuid);
    const name = text(entry.name);
    // `url_resolved` has already followed playlist redirects; prefer it.
    const stream = safeUrl(entry.url_resolved) ?? safeUrl(entry.url);

    // The upstream's own health flag beats probing 690 streams ourselves.
    if (!id || !name || !stream || entry.lastcheckok !== 1) continue;

    stations.push({
      id,
      name,
      stream,
      favicon: safeUrl(entry.favicon),
      tags: (text(entry.tags) ?? "")
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 8),
      codec: text(entry.codec) === "UNKNOWN" ? null : text(entry.codec),
      bitrate: num(entry.bitrate) || null,
      popularity: num(entry.clickcount) ?? 0,
      homepage: safeUrl(entry.homepage),
      state: text(entry.state),
      language: text(entry.language),
    });
  }

  return { stations, byId: new Map(stations.map((station) => [station.id, station])) };
}

/** Test seam. */
export function __resetRadio() {
  cached = null;
}
