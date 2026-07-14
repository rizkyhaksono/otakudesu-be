import { load } from 'cheerio';
import { getBaseUrl } from "@/lib/env";
import type { genre as genreType } from "@/types/types";

const mapGenres = (html: string): genreType[] => {
  const result: genreType[] = [];
  const baseUrl = getBaseUrl();
  const genres = html.split('</a>')
    .filter(item => item.trim() !== '')
    .map(item => `${item}</a>`);

  genres.forEach(genre => {
    const $ = load(genre);
    const href = $('a').attr('href') ?? '';

    result.push({
      name: $('a').text(),
      slug: href.replace(/^https:\/\/otakudesu\.[a-zA-Z0-9-]+\/genres\//, '').replace(/^\//, '').replace(/\/$/, ''),
      otakudesu_url: href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`
    });
  });

  return result;
};

export default mapGenres;