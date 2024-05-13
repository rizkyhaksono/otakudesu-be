import { NextResponse, NextRequest } from "next/server"
import otakudesu from "@/otakudesu"

export async function GET(request: NextRequest, { params }: { params: { slug: string; page: number } }) {
  try {
    const newHeaders = new Headers(request.headers)
    const { searchParams } = new URL(request.url)
    const reqPage = searchParams.get("page")
    newHeaders.set("Access-Control-Allow-Origin", "*")

    const pageNumber = reqPage ? parseInt(reqPage, 10) : 1
    const data = await otakudesu.animeByGenre(params.slug, pageNumber)
    return NextResponse.json({ data: data }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
