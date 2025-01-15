import { NextResponse, NextRequest } from "next/server"
import movie from "@/utils/movie";

export async function GET(request: NextRequest) {
  const urlParts = request.url.split("/")
  const animeSlug = urlParts[5]
  const data = await movie(animeSlug);
  return NextResponse.json({ data: data }, { status: 200 })
}
