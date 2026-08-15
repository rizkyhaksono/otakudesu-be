import { describe, expect, test } from "bun:test";
import { load } from "cheerio";
import { ANIME_BASE_URL, fixture } from "../helpers";
import scrapeOngoingAnime from "@/lib/anime/scrapeOngoingAnime";
import scrapeCompleteAnime from "@/lib/anime/scrapeCompleteAnime";
import scrapeSingleAnime from "@/lib/anime/scrapeSingleAnime";
import scrapeAnimeEpisodes from "@/lib/anime/scrapeAnimeEpisodes";
import scrapeSchedule from "@/lib/anime/scrapeSchedule";
import scrapeGenreLists from "@/lib/anime/scrapeGenreLists";
import mapGenres from "@/lib/anime/mapGenres";

const home = fixture("anime-home.html");
const detail = fixture("anime-detail.html");

describe("home listings", () => {
  const $ = load(home);

  test("scrapes ongoing anime cards", () => {
    const result = scrapeOngoingAnime($(".venutama .rseries .rapi:first .venz ul li").toString());
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]!.title).toBeTruthy();
    expect(result[0]!.slug).toBeTruthy();
    expect(result[0]!.slug).not.toContain("/");
  });

  test("scrapes complete anime cards", () => {
    const result = scrapeCompleteAnime($(".venutama .rseries .rapi:last .venz ul li").toString());
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]!.title).toBeTruthy();
  });
});

describe("anime detail", () => {
  const anime = scrapeSingleAnime(detail, ANIME_BASE_URL);

  test("extracts the core fields", () => {
    expect(anime).toBeDefined();
    expect(anime!.title).toBeTruthy();
    expect(anime!.slug).toBeTruthy();
    expect(anime!.genres.length).toBeGreaterThan(0);
  });

  test("returns an episode list", () => {
    expect(anime!.episode_lists.length).toBeGreaterThan(0);
    expect(anime!.episode_lists[0]!.slug).toBeTruthy();
  });

  test("episode numbers parse to integers", () => {
    const numbered = scrapeAnimeEpisodes(detail)!.filter((e) => e.episode_number !== undefined);
    expect(numbered.length).toBeGreaterThan(0);
    for (const episode of numbered) {
      expect(Number.isInteger(episode.episode_number)).toBe(true);
    }
  });
});

describe("schedule", () => {
  const days = scrapeSchedule(fixture("anime-schedule.html"));

  test("groups anime by day", () => {
    expect(days.length).toBeGreaterThan(0);
    expect(days[0]!.day).toBeTruthy();
    expect(days[0]!.anime_list.length).toBeGreaterThan(0);
  });

  test("does not hard-code a frontend domain in the response", () => {
    // A previous version baked one specific deployment's host into every URL.
    const urls = days.flatMap((day) => day.anime_list.map((a) => a.url));
    expect(urls.some((url) => url.includes("natee.my.id"))).toBe(false);
  });
});

describe("genres", () => {
  test("scrapes the genre directory", () => {
    const genres = scrapeGenreLists(fixture("anime-genre-list.html"), ANIME_BASE_URL);
    expect(genres.length).toBeGreaterThan(0);
    expect(genres[0]!.slug).toBeTruthy();
  });

  test("mapGenres is pure and uses the injected base URL", () => {
    const result = mapGenres('<a href="/genres/action">Action</a>', "https://example.test");
    expect(result[0]!.otakudesu_url).toBe("https://example.test/genres/action");
    expect(result[0]!.slug).toBe("action");
  });
});
