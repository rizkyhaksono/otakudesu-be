import scrapeAnimeByGenre from '@/lib/scrapeAnimeByGenre';
import { assertSlug } from '@/lib/env';
import { http } from '@/lib/http';

const animeByGenre = async (genre: string, page: number | string = 1) => {
  const safeGenre = assertSlug(genre, 'genre');
  const response = await http().get(`/genres/${safeGenre}/page/${page}`);
  return scrapeAnimeByGenre(response.data);
};

export default animeByGenre;
