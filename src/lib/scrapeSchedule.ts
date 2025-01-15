import { load } from 'cheerio';
import { ScheduleByDay } from '@/types/types';

const extractSlugFromUrl = (url: string): string => {
  const parts = url.split('/');
  return parts[parts.length - 2];
};

const scrapSchedule = (html: string): ScheduleByDay[] => {
  const $ = load(html);
  const scheduleByDay: ScheduleByDay[] = [];

  $('.kglist321').each((index, element) => {
    const day = $(element).find('h2').text().trim();
    const animeList: { anime_name: string; url: string; slug: string }[] = [];

    $(element).find('ul > li').each((liIndex, liElement) => {
      const anime_name = $(liElement).find('a').text().trim();
      const url = $(liElement).find('a').attr('href') ?? '';
      const slug = extractSlugFromUrl(url);
      const natee_url = "https://otakudesu.natee.my.id/anime/" + slug;

      const animeItem = {
        anime_name,
        url: natee_url,
        slug,
      };
      animeList.push(animeItem);
    });

    scheduleByDay.push({
      day: day,
      anime_list: animeList,
    });
  });

  return scheduleByDay;
};

export default scrapSchedule;
