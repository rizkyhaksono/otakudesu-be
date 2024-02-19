import { NextResponse, NextRequest } from "next/server";
import { useParams, usePathname } from "next/navigation";
import otakudesu from "@/otakudesu";

export async function GET(request: NextRequest, { params }: { params: { anime_slug: string, episode: number } }) {
  const pathname = usePathname()

  try {
    console.log(pathname)
    console.log(useParams)

    console.log(params.anime_slug)
    const data = await otakudesu.episode({ animeSlug: "kuzu-honkai-subtitle-indonesia", episodeNumber: params.episode });
    return NextResponse.json({ data: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}