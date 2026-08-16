import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: {
      name: "otakudesu-be",
      description: "Community API for anime, comics, movies and Indonesian live TV",
      version: "v1",
      docs: "/docs",
      openapi: "/api/openapi.json",
      domains: {
        anime: "/api/v1/anime",
        comic: "/api/v1/comic",
        movie: "/api/v1/movie",
        tv: "/api/v1/tv",
        radio: "/api/v1/radio",
        news: "/api/v1/news",
        search: "/api/v1/search",
      },
      repository: "https://github.com/rizkyhaksono/otakudesu-be",
    },
  });
}
