import { afterEach, beforeEach, describe, expect, setSystemTime, test } from "bun:test";
import { __resetHttpCache, fetchHtml } from "@/lib/shared/http";

const realFetch = globalThis.fetch;
let calls = 0;

function upstream(handler: (call: number) => Response | Promise<Response>) {
  globalThis.fetch = (async () => handler(++calls)) as unknown as typeof fetch;
}

beforeEach(() => {
  calls = 0;
  __resetHttpCache();
});

afterEach(() => {
  globalThis.fetch = realFetch;
  setSystemTime();
});

describe("http cache", () => {
  test("serves a fresh copy without calling upstream again", async () => {
    upstream((n) => new Response(`v${n}`));
    expect(await fetchHtml("https://x.test/a", { revalidate: 60 })).toBe("v1");
    expect(await fetchHtml("https://x.test/a", { revalidate: 60 })).toBe("v1");
    expect(calls).toBe(1);
  });

  test("refetches once the copy expires", async () => {
    upstream((n) => new Response(`v${n}`));
    setSystemTime(new Date("2026-01-01T00:00:00Z"));
    await fetchHtml("https://x.test/a", { revalidate: 60 });
    setSystemTime(new Date("2026-01-01T00:01:01Z"));
    expect(await fetchHtml("https://x.test/a", { revalidate: 60 })).toBe("v2");
  });

  test("falls back to the expired copy when the refresh fails", async () => {
    upstream((n) => (n === 1 ? new Response("good") : new Response("down", { status: 503 })));
    setSystemTime(new Date("2026-01-01T00:00:00Z"));
    await fetchHtml("https://x.test/a", { revalidate: 60, retries: 0 });
    setSystemTime(new Date("2026-01-01T00:02:00Z"));
    expect(await fetchHtml("https://x.test/a", { revalidate: 60, retries: 0 })).toBe("good");
  });

  test("an upstream 404 is not papered over with the stale copy", async () => {
    upstream((n) => (n === 1 ? new Response("good") : new Response("gone", { status: 404 })));
    setSystemTime(new Date("2026-01-01T00:00:00Z"));
    await fetchHtml("https://x.test/a", { revalidate: 60 });
    setSystemTime(new Date("2026-01-01T00:02:00Z"));
    await expect(fetchHtml("https://x.test/a", { revalidate: 60 })).rejects.toThrow();
  });

  test("concurrent misses share one upstream request", async () => {
    upstream(async (n) => {
      await Bun.sleep(10);
      return new Response(`v${n}`);
    });
    const results = await Promise.all(
      Array.from({ length: 5 }, () => fetchHtml("https://x.test/a", { revalidate: 60 })),
    );
    expect(results).toEqual(["v1", "v1", "v1", "v1", "v1"]);
    expect(calls).toBe(1);
  });

  test("revalidate 0 is never cached", async () => {
    upstream((n) => new Response(`v${n}`));
    await fetchHtml("https://x.test/a", { revalidate: 0 });
    expect(await fetchHtml("https://x.test/a", { revalidate: 0 })).toBe("v2");
  });
});
