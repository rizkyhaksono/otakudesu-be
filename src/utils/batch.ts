import getBatch from '@/lib/getBatch';
import scrapeBatch from '@/lib/scrapeBatch';
import { assertSlug } from '@/lib/env';
import { http } from '@/lib/http';

const batch = async ({ batchSlug, animeSlug }: {
  batchSlug?: string, animeSlug?: string
}) => {
  let batchPath: string | undefined = batchSlug ? assertSlug(batchSlug, 'batchSlug') : undefined;

  if (animeSlug) {
    const response = await http().get(`/anime/${assertSlug(animeSlug, 'animeSlug')}`);
    const batchData = getBatch(response.data);
    batchPath = batchData?.slug;
  }
  if (!batchPath) return false;

  const response = await http().get(`/batch/${batchPath}`);
  return scrapeBatch(response.data);
};

export default batch;
