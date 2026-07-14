import scrapeGenreLists from '../lib/scrapeGenreLists';
import { http } from '@/lib/http';
import type { genre as genreType } from '../types/types';

const genreLists = async (): Promise<genreType[]> => {
  const response = await http().get('/genre-list');
  return scrapeGenreLists(response.data);
};

export default genreLists;
