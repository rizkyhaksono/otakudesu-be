import { NextResponse, NextRequest } from "next/server"
import search from "@/utils/search";

export async function GET(request: NextRequest, props: { params: Promise<{ keyword: string }> }) {
  const params = await props.params;
  const data = await search(params.keyword)
  return NextResponse.json({ data: data }, { status: 200 })
}
