import { load } from "cheerio";
import type { ScheduleByDay } from "@/types/anime";

const extractSlugFromUrl = (url: string): string => {
  const parts = url.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "";
};

/**
 * Returns the upstream URL and the slug. It deliberately does not build a
 * front-end URL — the previous version hard-coded one specific deployment's
 * domain into the API response, which broke every other consumer.
 */
const scrapeSchedule = (html: string): ScheduleByDay[] => {
  const $ = load(html);
  const scheduleByDay: ScheduleByDay[] = [];

  $(".kglist321").each((_, element) => {
    const day = $(element).find("h2").text().trim();
    const anime_list: ScheduleByDay["anime_list"] = [];

    $(element)
      .find("ul > li")
      .each((_, liElement) => {
        const anime_name = $(liElement).find("a").text().trim();
        const url = $(liElement).find("a").attr("href") ?? "";
        const slug = extractSlugFromUrl(url);

        if (!anime_name && !slug) return;

        anime_list.push({ anime_name, url, slug });
      });

    scheduleByDay.push({ day, anime_list });
  });

  return scheduleByDay;
};

export default scrapeSchedule;
