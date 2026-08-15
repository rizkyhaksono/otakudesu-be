import { load } from "cheerio";
import type { genre as genreType } from "@/types/anime";

const scrapeGenreLists = (html: string, baseUrl: string): genreType[] => {
  const $ = load(html);
  const result: genreType[] = [];
  const genres = $("#venkonten .vezone ul.genres li a")
    .toString()
    .split("</a>")
    .filter((el) => el.trim() !== "")
    .map((el) => `${el}</a>`);

  genres.forEach((genre) => {
    const $genre = load(genre);
    const href = $genre("a").attr("href") ?? "";
    result.push({
      name: $genre("a").text(),
      slug: href.replace("/genres/", "").replace(/\//g, ""),
      otakudesu_url: href.startsWith("http")
        ? href
        : `${baseUrl}${href.startsWith("/") ? "" : "/"}${href}`,
    });
  });

  return result;
};

export default scrapeGenreLists;
