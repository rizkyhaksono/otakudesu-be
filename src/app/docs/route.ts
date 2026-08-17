import { ApiReference } from "@scalar/nextjs-api-reference";

/**
 * Interactive API reference, replacing the earlier hand-rolled listing page.
 *
 * The renderer bundle is vendored at `public/vendor/scalar-standalone.js`
 * rather than pulled from Scalar's CDN (the package's default): this project
 * treats "no third-party script on our own pages" as a rule, not just a
 * default, and a docs page is not exempt from it. `/docs` sits outside the
 * `/api/:path*` matcher in `next.config.ts`, so it never inherits the API's
 * `default-src 'none'` CSP — that header is for JSON responses, not this one.
 */
const handler = ApiReference({
  url: "/api/openapi.json",
  pageTitle: "Otakudesu Community API — Reference",
  cdn: "/vendor/scalar-standalone.js",
  theme: "none",
  darkMode: true,
  hideClientButton: true,
  metaData: {
    title: "Otakudesu Community API — Reference",
    description: "Interactive reference for every endpoint: anime, comics, movies, live TV, radio, news and search.",
  },
});

export const GET = handler;
