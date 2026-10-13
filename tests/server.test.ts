import { describe, expect, test } from "bun:test";
import { __resetRateLimit } from "@/lib/shared/rateLimit";
import server, { app, byPrecedence, routePath } from "@/server";

// Every request here stays inside the process: routes either need no upstream
// or fail validation before reaching one.
const get = (path: string, headers: Record<string, string> = {}) =>
  app.request(path, { headers: { "x-forwarded-for": "203.0.113.7", ...headers } });

describe("server", () => {
  test("health answers without touching the rate limiter", async () => {
    const response = await get("/api/health");
    expect(response.status).toBe(200);
    expect(response.headers.get("RateLimit-Limit")).toBeNull();
  });

  test("unknown routes are a JSON 404", async () => {
    const response = await get("/api/v1/nope");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not Found" });
  });

  test("bad params are a 400 from the handler's own validation", async () => {
    expect((await get("/api/v1/anime/ongoing/abc")).status).toBe(400);
    expect((await get("/api/v1/comic/bad%20slug!")).status).toBe(400);
  });

  test("API responses carry CORS and security headers", async () => {
    const response = await get("/api");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Content-Security-Policy")).toContain("default-src 'none'");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  test("preflight is answered without a handler", async () => {
    const response = await app.request("/api/v1/anime/home", { method: "OPTIONS" });
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET,OPTIONS");
  });

  test("legacy paths reach the v1 handler", async () => {
    // Same validation error as the v1 path proves it was routed there.
    const response = await get("/api/ongoing-anime/abc");
    expect(response.status).toBe(400);
  });

  test("docs and the root redirect", async () => {
    const docs = await app.request("/docs");
    expect(docs.status).toBe(200);
    expect(await docs.text()).toContain("/vendor/scalar-standalone.js");
    expect((await app.request("/")).headers.get("location")).toBe("/docs");
  });

  test("rate limits per client, except for the internal token", async () => {
    __resetRateLimit();
    process.env.INTERNAL_API_TOKEN = "test-token";
    const client = { "x-forwarded-for": "198.51.100.9" };

    let status = 200;
    for (let i = 0; i < 2000 && status !== 429; i++) status = (await get("/api", client)).status;
    expect(status).toBe(429);

    const internal = await get("/api", { ...client, "x-internal-token": "test-token" });
    expect(internal.status).toBe(200);
    delete process.env.INTERNAL_API_TOKEN;
  });
});

describe("Bun.serve options", () => {
  // Bun's default 10s idle timeout cut off slow upstream fetches mid-request.
  test("slow upstream requests are not cut off by Bun's 10s default", () => {
    expect(server.idleTimeout).toBeGreaterThanOrEqual(120);
  });
});

describe("route table", () => {
  test("maps file paths to Hono paths", () => {
    expect(routePath("api/v1/comic/[slug]/chapter/[chapter]/route.ts")).toBe(
      "/api/v1/comic/:slug/chapter/:chapter",
    );
    expect(routePath("api/route.ts")).toBe("/api");
  });

  test("literal segments win over parameters in the same position", () => {
    const sorted = ["/api/v1/comic/:slug", "/api/v1/comic/browse", "/api/v1/movie/:id", "/api/v1/movie/genres"].sort(
      byPrecedence,
    );
    expect(sorted.indexOf("/api/v1/comic/browse")).toBeLessThan(sorted.indexOf("/api/v1/comic/:slug"));
    expect(sorted.indexOf("/api/v1/movie/genres")).toBeLessThan(sorted.indexOf("/api/v1/movie/:id"));
  });
});
