import { NextResponse, NextRequest } from "next/server";
import otakudesu from "@/otakudesu";
import { runMiddleware, cors } from "@/config/middleware";

export async function GET(request: NextRequest, response: NextResponse, { params }: { params: { slug: string, page: number } }) {
  try {
    await runMiddleware(request, response, cors)

    const { searchParams } = new URL(request.url);
    const reqPage = (searchParams.get("page"));

    const pageNumber = reqPage ? parseInt(reqPage, 10) : 1;
    const data = await otakudesu.animeByGenre(params.slug, pageNumber);
    return NextResponse.json({ data: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}