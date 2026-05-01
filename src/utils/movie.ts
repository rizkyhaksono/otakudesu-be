import axios from 'axios';
import scrapeAnimeEpisodes from '@/lib/scrapeAnimeEpisodes';
import scrapeMovie from '@/lib/scrapeMovie';
import type { movie as movieType } from '@/types/types';

const { BASEURL } = process.env;
const movie = async (slug: string): Promise<movieType | undefined> => {
  const { data: animeHtml } = await axios.get(`${BASEURL}/anime/${slug}`);
  const episodes = scrapeAnimeEpisodes(animeHtml);
  const episodeSlug = episodes?.[0]?.slug;
  if (!episodeSlug) return undefined;

  const { data: episodeHtml } = await axios.get(`${BASEURL}/episode/${episodeSlug}`);
  return scrapeMovie(episodeHtml);
};

export default movie;
