import { NextResponse, NextRequest } from "next/server"
import otakudesu from "@/otakudesu"

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ anime_slug: string; episode: number }> }
) {
  const params = await props.params;
  try {
    const urlParts = request.url.split("/")
    const animeSlug = urlParts[5]
    const data = await otakudesu.episode({ animeSlug: animeSlug, episodeNumber: params.episode })
    return NextResponse.json({ data: data }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
