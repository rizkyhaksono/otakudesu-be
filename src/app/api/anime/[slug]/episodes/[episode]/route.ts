import { NextResponse, NextRequest } from "next/server";
import otakudesu from "@/otakudesu";
import { runMiddleware, cors } from "@/config/middleware";

export async function GET(request: NextRequest, response: NextResponse, { params }: { params: { anime_slug: string, episode: number } }) {
  try {
    await runMiddleware(request, response, cors);

    const urlParts = request.url.split('/');
    const animeSlug = urlParts[5];
    console.log(animeSlug);

    const data = await otakudesu.episode({ animeSlug: animeSlug, episodeNumber: params.episode });
    return NextResponse.json({ data: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}