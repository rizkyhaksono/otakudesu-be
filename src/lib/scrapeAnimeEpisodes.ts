import { load } from 'cheerio';
import type { episode_list } from '@/types/types';

const scrapeAnimeEpisodes = (html: string): episode_list[] | undefined => {
  const result: episode_list[] = [];
  let $ = load(html);
  $ = load(`<div> ${$('.episodelist').toString()}</div>`);

  const episodeList = $('.episodelist:nth-child(2) ul')
    .html()
    ?.split('</li>')
    .filter(item => item.trim() !== '')
    .map(item => `${item}</li>`);

  if (!episodeList) return undefined;

  for (const episode of episodeList) {
    const $ = load(episode);
    const titleText = $('li span:first a')?.text();

    const episodeNumber = titleText
      ?.replace(/^.*Episode\s+/, '')
      .replace(/\D.*$/, '')
      .trim();

    result.unshift({
      episode: titleText,
      episode_number: episodeNumber ? parseInt(episodeNumber, 10) : undefined,
      slug: $('li span:first a')?.attr('href')?.replace(/^https:\/\/otakudesu\.[a-zA-Z0-9-]+\/episode\//, '').replace('/', ''),
      otakudesu_url: $('li span:first a')?.attr('href')
    });
  }

  return result;
};

export default scrapeAnimeEpisodes;
