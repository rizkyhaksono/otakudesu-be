import { NextResponse, NextRequest } from "next/server"
import ongoingAnime from "@/utils/ongoingAnime";

export async function GET(request: NextRequest, props: { params: Promise<{ id: number }> }) {
  const params = await props.params;
  const data = await ongoingAnime(params.id)
  return NextResponse.json({ data: data }, { status: 200 })
}
