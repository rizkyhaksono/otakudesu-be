import { describe, expect, test } from "bun:test";
import { fixture } from "../helpers";
import {
  buildChapter,
  chapterNumber,
  parseChapterImages,
  parseDetail,
  parseGenres,
  parseHome,
  parseList,
} from "@/lib/comic/komiku";

const BASE = "https://komiku.org";
const LIST_BASE = "https://api.komiku.org";

describe("home", () => {
  const home = parseHome(fixture("comic-home.html"), BASE);

  test("maps latest updates and both rankings", () => {
    for (const list of [home.latest_manga, home.popular_manga, home.trending_manga]) {
      expect(list.length).toBeGreaterThan(0);
      expect(list[0]!.title).toBeTruthy();
      expect(list[0]!.slug).toMatch(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/);
      expect(list[0]!.poster).toStartWith("https://");
    }
  });

  test("uses the real cover, not the lazy-load placeholder", () => {
    expect(home.latest_manga.every((comic) => !comic.poster?.includes("lazy.jpg"))).toBe(true);
  });

  test("reads type from the flag and the latest chapter number", () => {
    const first = home.latest_manga[0]!;
    expect(["Manga", "Manhwa", "Manhua"]).toContain(first.type!);
    expect(first.latest_chapter?.chapter_number).toBeNumber();
  });

  test("ranking carries view counts", () => {
    expect(home.popular_manga[0]!.views_count).toBeGreaterThan(0);
  });

  test("has no novels", () => {
    expect(home.latest_novels).toEqual([]);
    expect(home.popular_novels).toEqual([]);
  });
});

describe("listings", () => {
  test("catalogue fragment maps items and sees the next page", () => {
    const page = parseList(fixture("comic-list.html"), LIST_BASE);
    expect(page.comics.length).toBeGreaterThan(0);
    expect(page.comics[0]!.type).toBe("Manhwa");
    expect(page.comics[0]!.latest_chapter?.chapter_number).toBeNumber();
    expect(page.hasNext).toBe(true);
  });

  test("search fragment resolves relative links and drops the update note", () => {
    const page = parseList(fixture("comic-search.html"), LIST_BASE);
    expect(page.comics.length).toBeGreaterThan(0);
    expect(page.comics[0]!.slug).toBeTruthy();
    expect(page.comics.every((comic) => !comic.synopsis?.startsWith("Update"))).toBe(true);
  });

  test("genres strip the title count and skip the placeholder option", () => {
    const genres = parseGenres(fixture("comic-home.html"));
    expect(genres.length).toBeGreaterThan(20);
    expect(genres.find((genre) => genre.slug === "action")?.name).toBe("Action");
    // Names may contain parentheses ("Shoujo(G)"); only the trailing count goes.
    expect(genres.every((genre) => !/\([\d.,]+\)$/.test(genre.name))).toBe(true);
  });
});

describe("detail", () => {
  const detail = parseDetail(fixture("comic-detail.html"), BASE, "black-clover-indonesia")!;

  test("maps the info table", () => {
    expect(detail.title).toBe("Black Clover");
    expect(detail.type).toBe("Manga");
    expect(detail.status).toBeTruthy();
    expect(detail.author).toBeTruthy();
    expect(detail.genres.map((genre) => genre.slug)).toContain("action");
    expect(detail.synopsis).not.toContain("<");
  });

  test("chapters are complete, numbered and newest first", () => {
    expect(detail.chapters.length).toBeGreaterThan(100);
    const numbers = detail.chapters.map((chapter) => chapter.chapter_number ?? 0);
    expect(numbers).toEqual([...numbers].sort((a, b) => b - a));
    expect(detail.chapters[0]!.released_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(detail.first_chapter).toBe(detail.chapters.at(-1)!);
  });

  test("a page without a title is not a comic", () => {
    expect(parseDetail("<html><body>nope</body></html>", BASE, "x")).toBeNull();
  });
});

describe("chapter", () => {
  const detail = parseDetail(fixture("comic-detail.html"), BASE, "black-clover-indonesia")!;
  const page = parseChapterImages(fixture("comic-chapter.html"), BASE);

  test("keeps page images in order and drops the promo", () => {
    expect(page.images.length).toBeGreaterThan(0);
    expect(page.images.every((src) => src.startsWith("https://"))).toBe(true);
    expect(page.images.some((src) => src.includes("promosi"))).toBe(false);
    expect(page.images[0]).toEndWith("/1.webp");
  });

  test("prev / next come from the detail chapter list", () => {
    const ref = detail.chapters.find((chapter) => chapter.chapter_number === 391)!;
    const chapter = buildChapter(detail, ref, page)!;
    expect(chapter.prev?.chapter_number).toBe(390);
    expect(chapter.next?.chapter_number).toBe(392);
    expect(chapter.comic.slug).toBe("black-clover-indonesia");
  });

  test("no images means no chapter", () => {
    expect(buildChapter(detail, detail.chapters[0]!, { title: null, images: [] })).toBeNull();
  });

  test("chapter numbers come from the label, or the slug as a fallback", () => {
    expect(chapterNumber("Chapter 79.2", null)).toBe(79.2);
    expect(chapterNumber("Chapter 01.1", null)).toBe(1.1);
    expect(chapterNumber("Oneshot", "foo-chapter-12-5")).toBe(12.5);
    expect(chapterNumber("Oneshot", "foo-oneshot")).toBeNull();
  });
});
