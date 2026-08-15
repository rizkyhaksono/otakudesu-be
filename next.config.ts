import type { NextConfig } from "next";

/**
 * Legacy (pre-v1) paths kept working via rewrites rather than duplicated route
 * files. Rewrites, not redirects, so existing API consumers need no changes.
 */
const legacyAnimeRewrites = [
  { source: "/api/home", destination: "/api/v1/anime/home" },
  { source: "/api/anime-list", destination: "/api/v1/anime/list" },
  { source: "/api/genre", destination: "/api/v1/anime/genres" },
  { source: "/api/genre/:slug", destination: "/api/v1/anime/genres/:slug" },
  { source: "/api/schedule", destination: "/api/v1/anime/schedule" },
  { source: "/api/search/:keyword", destination: "/api/v1/anime/search/:keyword" },
  { source: "/api/ongoing-anime", destination: "/api/v1/anime/ongoing/1" },
  { source: "/api/ongoing-anime/:page", destination: "/api/v1/anime/ongoing/:page" },
  { source: "/api/complete-anime", destination: "/api/v1/anime/complete/1" },
  { source: "/api/complete-anime/:page", destination: "/api/v1/anime/complete/:page" },
  { source: "/api/episode/:slug", destination: "/api/v1/anime/episode/:slug" },
  { source: "/api/batch/:slug", destination: "/api/v1/anime/batch/:slug" },
  { source: "/api/movie/:slug", destination: "/api/v1/anime/movie/:slug" },
  {
    source: "/api/anime/:slug/episodes/:episode",
    destination: "/api/v1/anime/detail/:slug/episodes/:episode",
  },
  { source: "/api/anime/:slug/episodes", destination: "/api/v1/anime/detail/:slug/episodes" },
  { source: "/api/anime/:slug", destination: "/api/v1/anime/detail/:slug" },
];

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  {
    key: "Content-Security-Policy",
    value: "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          // Public read-only community API: open CORS is intentional. It is
          // paired with per-IP rate limiting and no credential support.
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Accept, Content-Type" },
          { key: "Access-Control-Max-Age", value: "86400" },
          ...securityHeaders,
        ],
      },
    ];
  },

  async rewrites() {
    return legacyAnimeRewrites;
  },
};

export default nextConfig;
