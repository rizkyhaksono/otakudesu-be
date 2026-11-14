import { describe, expect, test } from "bun:test";
import { firstMediaUri, probeStream } from "@/lib/tv/probe";
import type { TvStream } from "@/types/tv";

const stream = (url: string): TvStream => ({
  url,
  quality: null,
  title: null,
  needs_proxy: false,
  user_agent: null,
  referrer: null,
  alive: null,
});

/** A fake upstream: path -> [status, content-type, body]. */
function upstream(routes: Record<string, [number, string, string]>): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    const [status, type, body] = routes[url] ?? [404, "text/plain", ""];
    const response = new Response(body, { status, headers: { "content-type": type } });
    Object.defineProperty(response, "url", { value: url });
    return response;
  }) as unknown as typeof fetch;
}

const M3U = "application/vnd.apple.mpegurl";
const master = "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=800000\nlow/index.m3u8\n";
const variant = "#EXTM3U\n#EXT-X-TARGETDURATION:6\n#EXTINF:6,\nseg1.ts\n";

describe("firstMediaUri", () => {
  test("resolves the first URI line relative to the playlist", () => {
    expect(firstMediaUri(master, "https://cdn.test/live/master.m3u8")).toBe("https://cdn.test/live/low/index.m3u8");
  });
  test("an empty playlist has no media", () => {
    expect(firstMediaUri("#EXTM3U\n", "https://cdn.test/a.m3u8")).toBeNull();
  });
});

describe("probeStream", () => {
  test("master -> variant -> segment that answers is alive", async () => {
    const fetchImpl = upstream({
      "https://cdn.test/live/master.m3u8": [200, M3U, master],
      "https://cdn.test/live/low/index.m3u8": [200, M3U, variant],
      "https://cdn.test/live/low/seg1.ts": [200, "video/mp2t", "x"],
    });
    expect(await probeStream(stream("https://cdn.test/live/master.m3u8"), fetchImpl)).toBe(true);
  });

  test("a playlist whose segments are gone is dead", async () => {
    const fetchImpl = upstream({
      "https://cdn.test/live/master.m3u8": [200, M3U, master],
      "https://cdn.test/live/low/index.m3u8": [200, M3U, variant],
    });
    expect(await probeStream(stream("https://cdn.test/live/master.m3u8"), fetchImpl)).toBe(false);
  });

  test("a dead variant behind a live master is dead", async () => {
    const fetchImpl = upstream({ "https://cdn.test/live/master.m3u8": [200, M3U, master] });
    expect(await probeStream(stream("https://cdn.test/live/master.m3u8"), fetchImpl)).toBe(false);
  });

  test("a 200 that is not a playlist is dead", async () => {
    const fetchImpl = upstream({ "https://cdn.test/live/master.m3u8": [200, "text/html", "<html>parked</html>"] });
    expect(await probeStream(stream("https://cdn.test/live/master.m3u8"), fetchImpl)).toBe(false);
  });

  test("a media playlist served directly (no master) is followed to its segment", async () => {
    const fetchImpl = upstream({
      "https://cdn.test/live/index.m3u8": [200, M3U, variant],
      "https://cdn.test/live/seg1.ts": [206, "video/mp2t", "x"],
    });
    expect(await probeStream(stream("https://cdn.test/live/index.m3u8"), fetchImpl)).toBe(true);
  });
});
