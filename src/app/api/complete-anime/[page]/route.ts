import { NextResponse, NextRequest } from "next/server"
import completeAnime from "@/utils/completeAnime";

export async function GET(request: NextRequest, props: { params: Promise<{ page: number }> }) {
  const params = await props.params;
  const data = await completeAnime(params.page)
  return NextResponse.json({ data: data }, { status: 200 })
}
