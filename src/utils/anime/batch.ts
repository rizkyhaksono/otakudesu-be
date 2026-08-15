import getBatch from "@/lib/anime/getBatch";
import scrapeBatch from "@/lib/anime/scrapeBatch";
import { assertSlug, getAnimeBaseUrl } from "@/lib/shared/env";
import { fetchHtml } from "@/lib/shared/http";

const batch = async ({ batchSlug, animeSlug }: { batchSlug?: string; animeSlug?: string }) => {
  const baseUrl = getAnimeBaseUrl();
  let batchPath: string | undefined = batchSlug ? assertSlug(batchSlug, "batchSlug") : undefined;

  if (animeSlug) {
    const animeHtml = await fetchHtml(
      `${baseUrl}/anime/${assertSlug(animeSlug, "animeSlug")}`,
      { revalidate: 1800 },
    );
    batchPath = getBatch(animeHtml)?.slug;
  }

  if (!batchPath) return false;

  const html = await fetchHtml(`${baseUrl}/batch/${batchPath}`, { revalidate: 3600 });
  return scrapeBatch(html);
};

export default batch;
