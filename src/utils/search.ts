import scrapeSearchResult from '@/lib/scrapeSearchResult';
import { http } from '@/lib/http';
import { searchResultAnime } from '@/types/types';

const search = async (keyword: string): Promise<searchResultAnime[]> => {
  const query = keyword.trim();
  if (!query || query.length > 100) {
    throw new Error('Invalid keyword');
  }

  const response = await http().get('/', {
    params: {
      s: query,
      post_type: 'anime',
    },
  });
  return scrapeSearchResult(response.data);
};

export default search;
