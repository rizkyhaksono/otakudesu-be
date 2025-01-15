import { NextResponse, NextRequest } from "next/server"
import animeByGenre from "@/utils/animeByGenre";

export async function GET(request: NextRequest, props: { params: Promise<{ slug: string; page: number }> }) {
  const params = await props.params;
  const { searchParams } = new URL(request.url)
  const reqPage = searchParams.get("page")
  const pageNumber = reqPage ? parseInt(reqPage, 10) : 1
  const data = await animeByGenre(params.slug, pageNumber)
  return NextResponse.json({ data: data }, { status: 200 })
}
