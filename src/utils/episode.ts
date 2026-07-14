import episodes from './episodes';
import scrapeEpisode from '@/lib/scrapeEpisode';
import { assertSlug } from '@/lib/env';
import { http } from '@/lib/http';

const episode = async ({ episodeSlug, animeSlug, episodeNumber }: {
  episodeSlug?: string | undefined, animeSlug?: string | undefined, episodeNumber?: number | undefined
}) => {
  let slug = '';

  if (episodeSlug) slug = assertSlug(episodeSlug, 'episodeSlug');
  if (animeSlug && episodeNumber !== undefined) {
    const episodeLists = await episodes(animeSlug);
    if (!episodeLists?.length || !episodeLists[0]?.slug) return undefined;

    const splittedEpisodeSlug = episodeLists[0].slug.split('-episode-');
    if (splittedEpisodeSlug.length < 2) return undefined;

    const prefixEpisodeSlug = splittedEpisodeSlug[0];
    const firstEpisodeNumber = splittedEpisodeSlug[1].replace('-sub-indo', '');

    slug = `${prefixEpisodeSlug}-episode-${episodeNumber - (parseInt(firstEpisodeNumber) == 0 ? 1 : 0)}-sub-indo`;
  }

  if (!slug) return undefined;

  const { data } = await http().get(`/episode/${slug}`);
  return scrapeEpisode(data);
};

export default episode;
