import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { checkRateLimit, clientKey, isInternalRequest, rateLimitHeaders } from "@/lib/shared/rateLimit";

/**
 * The HTTP server: Hono on Bun.
 *
 * Route handlers keep living in `src/app/api/**\/route.ts` and keep their
 * `GET(request, { params })` shape; they are discovered and mounted here, so
 * adding an endpoint is still "add a route.ts file" (plus `src/lib/openapi.ts`).
 */

type Handler = (request: Request, props: { params: Promise<Record<string, string>> }) => Promise<Response>;
type RouteModule = Partial<Record<"GET" | "POST", Handler>>;

const app = new Hono();

const API_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Accept, Content-Type",
  "Access-Control-Max-Age": "86400",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
};

// CORS and security headers on every API response, including errors and 429s.
app.use("/api/*", async (c, next) => {
  if (c.req.method === "OPTIONS") return new Response(null, { status: 204, headers: API_HEADERS });
  await next();
  for (const [key, value] of Object.entries(API_HEADERS)) c.res.headers.set(key, value);
});

// Pre-v1 paths. Registered before the rate limiter: the re-dispatched request
// passes through it once, as the real path.
const LEGACY: [string, string][] = [
  ["/api/home", "/api/v1/anime/home"],
  ["/api/anime-list", "/api/v1/anime/list"],
  ["/api/genre", "/api/v1/anime/genres"],
  ["/api/genre/:slug", "/api/v1/anime/genres/:slug"],
  ["/api/schedule", "/api/v1/anime/schedule"],
  ["/api/search/:keyword", "/api/v1/anime/search/:keyword"],
  ["/api/ongoing-anime", "/api/v1/anime/ongoing/1"],
  ["/api/ongoing-anime/:page", "/api/v1/anime/ongoing/:page"],
  ["/api/complete-anime", "/api/v1/anime/complete/1"],
  ["/api/complete-anime/:page", "/api/v1/anime/complete/:page"],
  ["/api/episode/:slug", "/api/v1/anime/episode/:slug"],
  ["/api/batch/:slug", "/api/v1/anime/batch/:slug"],
  ["/api/movie/:slug", "/api/v1/anime/movie/:slug"],
  ["/api/anime/:slug/episodes/:episode", "/api/v1/anime/detail/:slug/episodes/:episode"],
  ["/api/anime/:slug/episodes", "/api/v1/anime/detail/:slug/episodes"],
  ["/api/anime/:slug", "/api/v1/anime/detail/:slug"],
];

for (const [source, target] of LEGACY) {
  app.get(source, (c) => {
    const params = c.req.param() as Record<string, string>;
    const path = target.replace(/:(\w+)/g, (_, name: string) => encodeURIComponent(params[name] ?? ""));
    const url = new URL(c.req.url);
    url.pathname = path;
    return app.fetch(new Request(url.toString(), c.req.raw));
  });
}

// Every upstream call fans out to a third-party site; an unthrottled client can
// get this server's IP banned there.
app.use("/api/*", async (c, next) => {
  if (c.req.path === "/api/health" || isInternalRequest(c.req.raw)) return next();

  const result = checkRateLimit(clientKey(c.req.raw));
  const headers = rateLimitHeaders(result);
  if (!result.allowed) {
    return Response.json(
      { error: "Too Many Requests" },
      { status: 429, headers: { ...headers, "Cache-Control": "no-store" } },
    );
  }

  await next();
  for (const [key, value] of Object.entries(headers)) c.res.headers.set(key, value);
});

/** `api/v1/comic/[slug]/route.ts` → `/api/v1/comic/:slug`. */
export function routePath(file: string): string {
  const path = file.replace(/\/?route\.ts$/, "").replace(/\[(\w+)\]/g, ":$1");
  return `/${path}`;
}

/**
 * Hono tries routes in registration order, so a literal segment must be
 * registered before a parameter in the same position (`/comic/browse` before
 * `/comic/:slug`).
 */
export function byPrecedence(a: string, b: string): number {
  const left = a.split("/");
  const right = b.split("/");
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    const aParam = left[i].startsWith(":");
    const bParam = right[i].startsWith(":");
    if (aParam !== bParam) return aParam ? 1 : -1;
    if (left[i] !== right[i]) return left[i] < right[i] ? -1 : 1;
  }
  return left.length - right.length;
}

const routesDir = `${import.meta.dir}/app`;
const files = [...new Bun.Glob("api/**/route.ts").scanSync(routesDir)];
const routes = files.map((file) => ({ file, path: routePath(file) }));
routes.sort((a, b) => byPrecedence(a.path, b.path));

for (const { file, path } of routes) {
  const mod = (await import(`${routesDir}/${file}`)) as RouteModule;
  for (const method of ["GET", "POST"] as const) {
    const handler = mod[method];
    if (!handler) continue;
    app.on(method, path, (c) => handler(c.req.raw, { params: Promise.resolve(c.req.param() as Record<string, string>) }));
  }
}

// The renderer is vendored (public/vendor): no third-party script on our own
// pages, docs included. Outside /api/*, so it never gets the JSON-only CSP.
const DOCS_CONFIG = JSON.stringify({
  url: "/api/openapi.json",
  theme: "none",
  darkMode: true,
  hideClientButton: true,
});

app.get("/docs", (c) =>
  c.html(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Otakudesu Community API — Reference</title>
<meta name="description" content="Interactive reference for every endpoint: anime, comics, movies, live TV, radio, news and search.">
</head>
<body>
<div id="app"></div>
<script src="/vendor/scalar-standalone.js"></script>
<script>Scalar.createApiReference("#app", ${DOCS_CONFIG})</script>
</body>
</html>`),
);

app.get("/", (c) => c.redirect("/docs"));
app.use("/vendor/*", serveStatic({ root: "./public" }));
app.get("/favicon.ico", serveStatic({ path: "./public/favicon.ico" }));

app.notFound(() =>
  Response.json({ error: "Not Found" }, { status: 404, headers: { "Cache-Control": "no-store" } }),
);
app.onError((error) => {
  console.error("[server] unhandled error", error);
  return Response.json({ error: "Internal Server Error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
});

export { app };

export default {
  port: Number(process.env.PORT ?? 3000),
  // Not $HOSTNAME: Docker and macOS shells set it to the machine name.
  hostname: "0.0.0.0",
  // trace.moe uploads are capped at 10MB; refuse anything larger before reading it.
  maxRequestBodySize: 10 * 1024 * 1024,
  fetch: app.fetch,
};
