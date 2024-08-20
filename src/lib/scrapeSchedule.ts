import { load } from 'cheerio';
import { scheduleByDay } from '@/types/types';

const scrapSchedule = (html: string): scheduleByDay[] => {
  const $ = load(html);
  const scheduleByDay: scheduleByDay[] = [];

  $('.kglist321').each((index, element) => {
    const day = $(element).find('h2').text().trim();
    const animeList: { anime_name: string; url: string }[] = [];

    $(element).find('ul > li').each((liIndex, liElement) => {
      const anime_name = $(liElement).find('a').text().trim();
      const url = $(liElement).find('a').attr('href') ?? '';

      const animeItem = {
        anime_name,
        url
      };
      animeList.push(animeItem);
    });

    scheduleByDay.push({
      day: day,
      anime_list: animeList
    });
  });

  return scheduleByDay;
};

export default scrapSchedule;
