import { NextResponse, NextRequest } from "next/server"
import otakudesu from "@/otakudesu"

export async function GET(request: NextRequest, { params }: { params: { page: number } }) {
  try {
    const data = await otakudesu.completeAnime(params.page)
    return NextResponse.json({ data: data }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
