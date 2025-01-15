import { NextResponse, NextRequest } from "next/server"
import genreLists from "@/utils/genreLists"

export async function GET() {
  const data = await genreLists()
  return NextResponse.json({ data: data }, { status: 200 })
}
