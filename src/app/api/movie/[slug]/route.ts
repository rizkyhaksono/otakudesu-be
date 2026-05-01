import { NextResponse, NextRequest } from "next/server"
import movie from "@/utils/movie";

export async function GET(request: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  try {
    const data = await movie(params.slug)
    if (!data) return NextResponse.json({ error: "Not Found" }, { status: 404 })
    return NextResponse.json({ data: data }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
