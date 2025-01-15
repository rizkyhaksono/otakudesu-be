import { NextResponse, NextRequest } from "next/server"
import episode from "@/utils/episode";

export async function GET(request: NextRequest, props: { params: Promise<{ anime_slug: string; episode: number }> }) {
  const params = await props.params;
  const urlParts = request.url.split("/")
  const animeSlug = urlParts[5]
  const data = await episode({ animeSlug: animeSlug, episodeNumber: params.episode })
  return NextResponse.json({ data: data }, { status: 200 })
}
