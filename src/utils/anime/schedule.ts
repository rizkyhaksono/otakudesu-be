import scrapeSchedule from "@/lib/anime/scrapeSchedule";
import { getAnimeBaseUrl } from "@/lib/shared/env";
import { fetchHtml } from "@/lib/shared/http";

const schedule = async () => {
  const html = await fetchHtml(`${getAnimeBaseUrl()}/jadwal-rilis`, { revalidate: 3600 });
  return scrapeSchedule(html);
};

export default schedule;
