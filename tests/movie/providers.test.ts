import { describe, expect, test } from "bun:test";
import { enabledProviders, movieSources, tvSources } from "@/lib/movie/providers";

describe("embed provider registry", () => {
  test("enables every known provider by default", () => {
    expect(enabledProviders().map((p) => p.id)).toEqual([
      "2embed",
      "videasy",
      "vidsrc",
      "vidsrccc",
      "vidlink",
      "embedsu",
      "autoembed",
    ]);
  });

  test("builds movie URLs from a TMDB id", () => {
    const sources = movieSources(27205);
    expect(sources.length).toBeGreaterThanOrEqual(5);
    expect(sources[0]!.url).toBe("https://www.2embed.cc/embed/27205");
    for (const source of sources) expect(source.url).toContain("27205");
  });

  test("builds TV URLs with season and episode", () => {
    const sources = tvSources(1399, 1, 1);
    expect(sources[0]!.url).toBe("https://www.2embed.cc/embedtv/1399&s=1&e=1");
    expect(sources[1]!.url).toBe("https://player.videasy.net/tv/1399/1/1");
  });

  test("honours MOVIE_EMBED_PROVIDERS", () => {
    const previous = process.env.MOVIE_EMBED_PROVIDERS;
    process.env.MOVIE_EMBED_PROVIDERS = "videasy";
    try {
      expect(enabledProviders().map((p) => p.id)).toEqual(["videasy"]);
    } finally {
      if (previous === undefined) delete process.env.MOVIE_EMBED_PROVIDERS;
      else process.env.MOVIE_EMBED_PROVIDERS = previous;
    }
  });

  test("ignores unknown provider ids", () => {
    const previous = process.env.MOVIE_EMBED_PROVIDERS;
    process.env.MOVIE_EMBED_PROVIDERS = "videasy,does-not-exist";
    try {
      expect(enabledProviders()).toHaveLength(1);
    } finally {
      if (previous === undefined) delete process.env.MOVIE_EMBED_PROVIDERS;
      else process.env.MOVIE_EMBED_PROVIDERS = previous;
    }
  });
});
