import { describe, expect, test } from "bun:test";
import animeHome from "@/utils/anime/home";
import animeList from "@/utils/anime/animeList";
import animeSchedule from "@/utils/anime/schedule";
import animeDetail from "@/utils/anime/anime";
import comicHome from "@/utils/comic/home";
import comicDetail from "@/utils/comic/detail";
import comicChapter from "@/utils/comic/chapter";
import { tvChannels } from "@/utils/tv/channels";
import { isTmdbConfigured } from "@/lib/movie/tmdb";
import movieHome from "@/utils/movie/home";

/**
 * Opt-in suite — this one *does* hit the real upstreams.
 *
 * It is not part of `bun test` and never gates a PR, because a third-party site
 * being down is not a reason to block a contributor. It runs nightly in CI and
 * opens an issue when a source breaks, which is how we find out before users do.
 *
 *   bun run test:live
 */

describe("anime upstream", () => {
  test("home returns both listings", async () => {
    const result = await animeHome();
    expect(result.ongoing_anime.length).toBeGreaterThan(0);
    expect(result.complete_anime.length).toBeGreaterThan(0);
    expect(result.ongoing_anime[0]!.title).toBeTruthy();
    expect(result.ongoing_anime[0]!.slug).toBeTruthy();
  });

  test("A–Z directory is populated", async () => {
    const groups = await animeList();
    expect(groups.length).toBeGreaterThan(5);
    expect(groups.some((group) => group.anime_list.length > 0)).toBe(true);
  });

  test("schedule covers multiple days", async () => {
    const days = await animeSchedule();
    expect(days.length).toBeGreaterThanOrEqual(7);
  });

  test("detail resolves from a slug found on the homepage", async () => {
    const { ongoing_anime } = await animeHome();
    const slug = ongoing_anime[0]!.slug!;
    const detail = await animeDetail(slug);

    expect(detail).toBeDefined();
    expect(detail!.title).toBeTruthy();
    expect(detail!.episode_lists.length).toBeGreaterThan(0);
  });
});

describe("comic upstream", () => {
  test("home returns manga listings", async () => {
    const home = await comicHome();
    expect(home.latest_manga.length).toBeGreaterThan(0);
    expect(home.popular_manga.length).toBeGreaterThan(0);
  });

  test("detail and reader work end to end", async () => {
    const home = await comicHome();
    const first = home.latest_manga[0]!;

    const detail = await comicDetail(first.slug!);
    expect(detail).not.toBeNull();
    expect(detail!.chapters.length).toBeGreaterThan(0);

    const chapterNumber = detail!.chapters[0]!.chapter_number!;
    const chapter = await comicChapter(first.slug!, chapterNumber);

    // The reader is the feature most worth guarding: no images means no comic.
    expect(chapter).not.toBeNull();
    expect(chapter!.images.length).toBeGreaterThan(0);
    expect(chapter!.chapters.length).toBeGreaterThan(0);
  });
});

describe("live TV upstream", () => {
  test("indexes a meaningful number of Indonesian channels", async () => {
    const { channels, total } = await tvChannels();
    expect(total).toBeGreaterThan(50);
    expect(channels[0]!.streams.length).toBeGreaterThan(0);
  });
});

describe("movie upstream", () => {
  test.skipIf(!isTmdbConfigured())("TMDB returns trending and popular titles", async () => {
    const home = await movieHome();
    expect(home.trending.length).toBeGreaterThan(0);
    expect(home.popular_movies.length).toBeGreaterThan(0);
    expect(home.popular_movies[0]!.title).toBeTruthy();
  });
});
