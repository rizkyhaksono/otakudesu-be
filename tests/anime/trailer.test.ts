import { describe, expect, test } from "bun:test";
import { fixture } from "../helpers";
import { pickTrailer, type RawMedia } from "@/lib/anime/trailer";

// A real AniList `Page.media(search:)` response for "Sousou no Frieren 2nd Season".
const media = (JSON.parse(fixture("anilist-trailer-search.json")) as { data: { Page: { media: RawMedia[] } } })
  .data.Page.media;

const frieren2: RawMedia = {
  title: { romaji: "Sousou no Frieren 2nd Season", english: "Frieren: Beyond Journey's End Season 2" },
  synonyms: [],
  trailer: { id: "RH-FcW94z00", site: "youtube" },
};

describe("pickTrailer", () => {
  test("returns the season's own trailer from a real search response", () => {
    expect(pickTrailer(media, "Sousou no Frieren 2nd Season")).toEqual({
      youtubeId: "RH-FcW94z00",
      matchedTitle: "Sousou no Frieren 2nd Season",
    });
  });

  test("matches on the English title too", () => {
    expect(pickTrailer([frieren2], "Frieren Beyond Journey's End Season 2")?.youtubeId).toBe("RH-FcW94z00");
  });

  test("rejects a plausible but different show", () => {
    expect(pickTrailer(media, "One Piece")).toBeNull();
  });

  test("skips a matching entry with no trailer and takes the next confident one", () => {
    const noTrailer = { ...frieren2, trailer: null };
    expect(pickTrailer([noTrailer, frieren2], "Sousou no Frieren 2nd Season")?.youtubeId).toBe("RH-FcW94z00");
  });

  test("ignores trailers that are not on YouTube", () => {
    const dailymotion = { ...frieren2, trailer: { id: "x8abcde", site: "dailymotion" } };
    expect(pickTrailer([dailymotion], "Sousou no Frieren 2nd Season")).toBeNull();
  });

  test("never passes an id that is not a YouTube id into the iframe URL", () => {
    const hostile = { ...frieren2, trailer: { id: 'x" onload="alert(1)', site: "youtube" } };
    expect(pickTrailer([hostile], "Sousou no Frieren 2nd Season")).toBeNull();
  });

  test("no results is null", () => {
    expect(pickTrailer([], "Anything")).toBeNull();
  });
});
