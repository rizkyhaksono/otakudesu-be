import { load } from "cheerio";
import type { genre as genreType } from "@/types/anime";

/**
 * Take the last path segment, so both absolute upstream links and relative
 * `/genres/action` hrefs yield the same slug.
 */
const genreSlug = (href: string): string => {
  const path = href.replace(/^https?:\/\/[^/]+/, "");
  const segments = path.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "";
};

/**
 * Pure: `baseUrl` is passed in rather than read from the environment, so the
 * scraper can be unit-tested against a fixture without any env setup.
 */
const mapGenres = (html: string, baseUrl: string): genreType[] => {
  const result: genreType[] = [];
  const genres = html
    .split("</a>")
    .filter((item) => item.trim() !== "")
    .map((item) => `${item}</a>`);

  genres.forEach((genre) => {
    const $ = load(genre);
    const href = $("a").attr("href") ?? "";

    result.push({
      name: $("a").text(),
      slug: genreSlug(href),
      otakudesu_url: href.startsWith("http")
        ? href
        : `${baseUrl}${href.startsWith("/") ? "" : "/"}${href}`,
    });
  });

  return result;
};

export default mapGenres;
