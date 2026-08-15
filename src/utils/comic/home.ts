import { getComicBaseUrl } from "@/lib/shared/env";
import { fetchHtml } from "@/lib/shared/http";
import { expectComponent, parseInertia } from "@/lib/comic/inertia";
import { mapSummaries } from "@/lib/comic/mappers";
import type { ComicHome } from "@/types/comic";

const comicHome = async (): Promise<ComicHome> => {
  const html = await fetchHtml(`${getComicBaseUrl()}/`, { revalidate: 300 });
  const props = expectComponent(parseInertia(html), "Home") as Record<string, unknown>;

  return {
    popular_manga: mapSummaries(props.popularManga),
    trending_manga: mapSummaries(props.trendingManga),
    latest_manga: mapSummaries(props.latestMangaUpdates),
    popular_novels: mapSummaries(props.popularNovels),
    latest_novels: mapSummaries(props.latestNovelUpdates),
  };
};

export default comicHome;
