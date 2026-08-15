import scrapeSearchResult from "@/lib/anime/scrapeSearchResult";
import { getAnimeBaseUrl } from "@/lib/shared/env";
import { fetchHtml } from "@/lib/shared/http";
import { keywordSchema, parse } from "@/lib/shared/validate";
import type { searchResultAnime } from "@/types/anime";

const search = async (keyword: string): Promise<searchResultAnime[]> => {
  const baseUrl = getAnimeBaseUrl();
  const query = parse(keywordSchema, keyword, "keyword");

  const url = new URL(baseUrl);
  url.searchParams.set("s", query);
  url.searchParams.set("post_type", "anime");

  const html = await fetchHtml(url.toString(), { revalidate: 300 });
  return scrapeSearchResult(html, baseUrl);
};

export default search;
