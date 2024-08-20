import axios from "axios";
import scrapSchedule from "@/lib/scrapeSchedule";

const { BASEURL } = process.env;
const schedule = async () => {
  const response = await axios.get(`${BASEURL}/jadwal-rilis`);
  const result = scrapSchedule(response.data);

  return result;
};

export default schedule;