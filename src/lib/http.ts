import axios, { type AxiosInstance } from "axios";
import { getBaseUrl } from "@/lib/env";

let client: AxiosInstance | null = null;

export function http(): AxiosInstance {
  if (!client) {
    client = axios.create({
      baseURL: getBaseUrl(),
      timeout: 15_000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; otakudesu-be/2.0; +https://github.com/rizkyhaksono/otakudesu-be)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  }

  return client;
}

export { axios };
