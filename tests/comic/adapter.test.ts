import { describe, expect, test } from "bun:test";
import { fixture } from "../helpers";
import { expectComponent, parseInertia } from "@/lib/comic/inertia";
import { mapChapter, mapDetail, mapSummaries } from "@/lib/comic/mappers";

describe("Inertia parsing", () => {
  test("reads the data-page payload", () => {
    const page = parseInertia(fixture("comic-home.html"));
    expect(page.component).toBe("Home");
    expect(page.props).toBeTruthy();
  });

  test("throws on a page without data-page", () => {
    expect(() => parseInertia("<html><body>nope</body></html>")).toThrow();
  });

  test("expectComponent turns a wrong page into a 404", () => {
    const page = parseInertia(fixture("comic-home.html"));
    expect(() => expectComponent(page, "Manga/Show")).toThrow();
  });
});

describe("home mapping", () => {
  const props = parseInertia(fixture("comic-home.html")).props as Record<string, unknown>;

  test("maps the manga listings", () => {
    const latest = mapSummaries(props.latestMangaUpdates);
    expect(latest.length).toBeGreaterThan(0);
    expect(latest[0]!.title).toBeTruthy();
    expect(latest[0]!.slug).toBeTruthy();
  });

  test("strips HTML out of novel synopses", () => {
    // Upstream ships raw <p> markup inside this field.
    for (const novel of mapSummaries(props.popularNovels)) {
      expect(novel.synopsis ?? "").not.toContain("<p>");
      expect(novel.synopsis ?? "").not.toContain("<");
    }
  });
});

describe("detail mapping", () => {
  const props = parseInertia(fixture("comic-detail.html")).props as Record<string, unknown>;
  const detail = mapDetail(props)!;

  test("returns metadata and a chapter list", () => {
    expect(detail.title).toBeTruthy();
    expect(detail.chapters.length).toBeGreaterThan(0);
  });

  test("orders chapters newest first", () => {
    const numbers = detail.chapters.map((c) => c.chapter_number ?? 0);
    expect(numbers).toEqual([...numbers].sort((a, b) => b - a));
  });
});

describe("chapter (reader) mapping", () => {
  const props = parseInertia(fixture("comic-chapter.html")).props as Record<string, unknown>;
  const chapter = mapChapter(props)!;

  test("returns the ordered page images", () => {
    expect(chapter.images.length).toBeGreaterThan(0);
    for (const image of chapter.images) expect(image.startsWith("https://")).toBe(true);
  });

  test("exposes navigation and the chapter selector", () => {
    expect(chapter.chapters.length).toBeGreaterThan(0);
    // This fixture is the newest chapter, so there is a previous but no next.
    expect(chapter.prev).not.toBeNull();
  });

  test("returns null when a chapter has no images", () => {
    expect(mapChapter({ chapter: { images: [] }, manga: {} })).toBeNull();
  });
});
