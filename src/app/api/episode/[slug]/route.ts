import { NextResponse, NextRequest } from "next/server"
import episode from "@/utils/episode";

export async function GET(request: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const data = await episode({ episodeSlug: params.slug })
  return NextResponse.json({ data: data }, { status: 200 })
}
