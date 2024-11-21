import { NextResponse, NextRequest } from "next/server"
import otakudesu from "@/otakudesu"

export async function GET(request: NextRequest, props: { params: Promise<{ id: number }> }) {
  const params = await props.params;
  try {
    const data = await otakudesu.ongoingAnime(params.id)
    return NextResponse.json({ data: data }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
