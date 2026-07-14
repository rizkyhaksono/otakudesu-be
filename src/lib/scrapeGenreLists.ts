import { load } from 'cheerio';
import { getBaseUrl } from '@/lib/env';
import type { genre as genreType } from '@/types/types';

const scrapeGenreLists = (html: string): genreType[] => {
  const $ = load(html);
  const result: genreType[] = [];
  const baseUrl = getBaseUrl();
  const genres = $('#venkonten .vezone ul.genres li a').toString()
    .split('</a>')
    .filter((el) => el.trim() !== '')
    .map((el) => `${el}</a>`);

  genres.forEach((genre) => {
    const $ = load(genre);
    const href = $('a').attr('href') ?? '';
    result.push({
      name: $('a').text(),
      slug: href.replace('/genres/', '').replace(/\//g, ''),
      otakudesu_url: href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`
    });
  });

  return result;
};

export default scrapeGenreLists;
