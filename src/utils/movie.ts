import scrapeAnimeEpisodes from '@/lib/scrapeAnimeEpisodes';
import scrapeMovie from '@/lib/scrapeMovie';
import { assertSlug } from '@/lib/env';
import { http } from '@/lib/http';
import type { movie as movieType } from '@/types/types';

const movie = async (slug: string): Promise<movieType | undefined> => {
  const safeSlug = assertSlug(slug);
  const { data: animeHtml } = await http().get(`/anime/${safeSlug}`);
  const episodes = scrapeAnimeEpisodes(animeHtml);
  const episodeSlug = episodes?.[0]?.slug;
  if (!episodeSlug) return undefined;

  const { data: episodeHtml } = await http().get(`/episode/${episodeSlug}`);
  return scrapeMovie(episodeHtml);
};

export default movie;
