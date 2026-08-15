import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: {
      name: "otakudesu-be",
      description: "Community API for anime, comics, movies and Indonesian live TV",
      version: "v1",
      docs: "/api/docs",
      domains: {
        anime: "/api/v1/anime",
        comic: "/api/v1/comic",
        movie: "/api/v1/movie",
        tv: "/api/v1/tv",
      },
      repository: "https://github.com/rizkyhaksono/otakudesu-be",
    },
  });
}
