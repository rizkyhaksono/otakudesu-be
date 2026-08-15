import episodes from "./episodes";
import scrapeEpisode from "@/lib/anime/scrapeEpisode";
import { assertSlug, getAnimeBaseUrl } from "@/lib/shared/env";
import { fetchHtml } from "@/lib/shared/http";

const episode = async ({
  episodeSlug,
  animeSlug,
  episodeNumber,
}: {
  episodeSlug?: string;
  animeSlug?: string;
  episodeNumber?: number;
}) => {
  const baseUrl = getAnimeBaseUrl();
  let slug = "";

  if (episodeSlug) slug = assertSlug(episodeSlug, "episodeSlug");

  if (animeSlug && episodeNumber !== undefined) {
    const episodeLists = await episodes(animeSlug);
    const firstSlug = episodeLists?.[0]?.slug;
    if (!firstSlug) return undefined;

    // Series are inconsistently 0- or 1-indexed upstream; derive the offset
    // from the first episode's own slug rather than assuming.
    const parts = firstSlug.split("-episode-");
    if (parts.length < 2) return undefined;

    const prefix = parts[0];
    const firstEpisodeNumber = parts[1]!.replace("-sub-indo", "");
    const offset = Number.parseInt(firstEpisodeNumber, 10) === 0 ? 1 : 0;

    slug = `${prefix}-episode-${episodeNumber - offset}-sub-indo`;
  }

  if (!slug) return undefined;

  const html = await fetchHtml(`${baseUrl}/episode/${slug}`, { revalidate: 600 });
  return scrapeEpisode(html, baseUrl);
};

export default episode;
