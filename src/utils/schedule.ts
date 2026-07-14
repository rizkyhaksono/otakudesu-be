import scrapSchedule from "@/lib/scrapeSchedule";
import { http } from "@/lib/http";

const schedule = async () => {
  const response = await http().get("/jadwal-rilis");
  return scrapSchedule(response.data);
};

export default schedule;
