import { beforeEach, describe, expect, test } from "bun:test";
import { __resetRateLimit, checkRateLimit, clientKey } from "@/lib/shared/rateLimit";

beforeEach(() => __resetRateLimit());

describe("checkRateLimit", () => {
  test("allows traffic up to the limit then rejects", () => {
    const limit = checkRateLimit("a").limit;
    for (let i = 1; i < limit; i++) checkRateLimit("a");

    expect(checkRateLimit("a").allowed).toBe(false);
  });

  test("keeps buckets independent per client", () => {
    const limit = checkRateLimit("a").limit;
    for (let i = 0; i < limit + 5; i++) checkRateLimit("a");

    expect(checkRateLimit("b").allowed).toBe(true);
  });

  test("refills over time", () => {
    const start = 1_000_000;
    const limit = checkRateLimit("c", start).limit;
    for (let i = 0; i < limit + 5; i++) checkRateLimit("c", start);

    expect(checkRateLimit("c", start).allowed).toBe(false);
    expect(checkRateLimit("c", start + 60_000).allowed).toBe(true);
  });

  test("reports a positive retry-after when blocked", () => {
    const limit = checkRateLimit("d").limit;
    for (let i = 0; i < limit + 5; i++) checkRateLimit("d");

    expect(checkRateLimit("d").retryAfter).toBeGreaterThan(0);
  });
});

describe("clientKey", () => {
  test("prefers the first x-forwarded-for entry", () => {
    const request = new Request("https://a.test", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });
    expect(clientKey(request)).toBe("203.0.113.5");
  });

  test("falls back to x-real-ip then unknown", () => {
    expect(clientKey(new Request("https://a.test", { headers: { "x-real-ip": "198.51.100.7" } })))
      .toBe("198.51.100.7");
    expect(clientKey(new Request("https://a.test"))).toBe("unknown");
  });
});
