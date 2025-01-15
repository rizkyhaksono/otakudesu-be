import { NextResponse, NextRequest } from "next/server"
import ongoingAnime from "@/utils/ongoingAnime"

export async function GET() {
  const data = await ongoingAnime()
  return NextResponse.json({ data: data }, { status: 200 })
}
