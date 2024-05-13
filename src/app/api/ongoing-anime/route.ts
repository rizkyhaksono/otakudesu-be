import { NextResponse, NextRequest } from "next/server"
import otakudesu from "@/otakudesu"

export async function GET(response: NextResponse, request: NextRequest) {
  try {
    const data = await otakudesu.ongoingAnime()
    return NextResponse.json({ data: data }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
