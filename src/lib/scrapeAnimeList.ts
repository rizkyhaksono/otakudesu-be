import { load } from 'cheerio';
import type { animeListGroup, animeListEntry } from '@/types/types';

const scrapeAnimeList = (html: string): animeListGroup[] => {
  const $ = load(html);
  const groups: animeListGroup[] = [];

  $('#abtext .bariskelom').each((_, groupEl) => {
    const letter = $(groupEl).find('.barispenz a').first().text().trim();
    const anime_list: animeListEntry[] = [];

    $(groupEl).find('.jdlbar ul li a.hodebgst').each((_, animeEl) => {
      const $a = $(animeEl);
      const otakudesu_url = $a.attr('href');
      anime_list.push({
        title: $a.clone().children().remove().end().text().trim(),
        slug: otakudesu_url
          ?.replace(/^https:\/\/otakudesu\.[a-zA-Z0-9-]+\/anime\//, '')
          .replace(/\/$/, ''),
        otakudesu_url,
      });
    });

    if (letter || anime_list.length) {
      groups.push({ letter, anime_list });
    }
  });

  return groups;
};

export default scrapeAnimeList;
