import { num, text, url } from "@/lib/shared/sanitize";
import type {
  ComicChapter,
  ComicChapterRef,
  ComicDetail,
  ComicGenre,
  ComicSummary,
} from "@/types/comic";

/**
 * Mappers are deliberately defensive: every field is read through a coercion
 * helper so a missing or reshaped upstream field yields `null` rather than
 * throwing. Text fields go through `text()`, which strips HTML — the upstream
 * ships raw `<p>` markup inside novel synopses.
 */

type Raw = Record<string, unknown>;

const asRecord = (value: unknown): Raw => (value && typeof value === "object" ? (value as Raw) : {});
const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export function mapGenre(raw: unknown): ComicGenre | null {
  const genre = asRecord(raw);
  const name = text(genre.name);
  const slug = text(genre.slug);
  if (!name || !slug) return null;
  return { name, slug, icon: text(genre.icon) };
}

export function mapChapterRef(raw: unknown): ComicChapterRef | null {
  const chapter = asRecord(raw);
  const chapter_number = num(chapter.chapter_number);
  const slug = text(chapter.slug);
  if (chapter_number === null && !slug) return null;

  return {
    title: text(chapter.title),
    slug,
    chapter_number,
    released_at: text(chapter.created_at),
  };
}

export function mapSummary(raw: unknown): ComicSummary | null {
  const comic = asRecord(raw);
  const slug = text(comic.slug);
  const title = text(comic.title);
  if (!slug || !title) return null;

  return {
    title,
    slug,
    poster: url(comic.poster),
    type: text(comic.type),
    status: text(comic.status),
    rating: num(comic.rating),
    release_year: num(comic.release_year),
    views_count: num(comic.views_count),
    synopsis: text(comic.synopsis),
    genres: asArray(comic.genres).map(mapGenre).filter(isPresent),
    latest_chapter: mapChapterRef(comic.last_chapter),
  };
}

export function mapSummaries(raw: unknown): ComicSummary[] {
  return asArray(raw).map(mapSummary).filter(isPresent);
}

export function mapDetail(props: Raw): ComicDetail | null {
  const manga = asRecord(props.manga);
  const summary = mapSummary(manga);
  if (!summary) return null;

  const chapters = asArray(manga.chapters).map(mapChapterRef).filter(isPresent);
  // Upstream order is newest-first; keep it, but make it deterministic.
  chapters.sort((a, b) => (b.chapter_number ?? 0) - (a.chapter_number ?? 0));

  return {
    ...summary,
    author: text(manga.author),
    artist: text(manga.artist),
    rank: num(props.mangaRank),
    total_raters: num(props.totalRaters),
    chapters,
    first_chapter: mapChapterRef(props.firstChapter),
    related: mapSummaries(props.relatedMangas),
  };
}

export function mapChapter(props: Raw): ComicChapter | null {
  const chapter = asRecord(props.chapter);
  const manga = asRecord(props.manga);

  const images = asArray(chapter.images)
    .map((entry) => {
      const image = asRecord(entry);
      const src = url(image.image_path);
      if (!src) return null;
      return { src, order: num(image.order) ?? 0 };
    })
    .filter(isPresent)
    .sort((a, b) => a.order - b.order)
    .map((image) => image.src);

  if (!images.length) return null;

  const chapters = asArray(props.chapters).map(mapChapterRef).filter(isPresent);
  chapters.sort((a, b) => (b.chapter_number ?? 0) - (a.chapter_number ?? 0));

  return {
    comic: {
      title: text(manga.title),
      slug: text(manga.slug),
      poster: url(manga.poster),
    },
    title: text(chapter.title),
    slug: text(chapter.slug),
    chapter_number: num(chapter.chapter_number),
    released_at: text(chapter.created_at),
    images,
    prev: mapChapterRef(props.prev),
    next: mapChapterRef(props.next),
    chapters,
  };
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}
