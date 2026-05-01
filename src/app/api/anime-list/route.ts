import { NextResponse } from "next/server"
import animeList from "@/utils/animeList";

export async function GET() {
  try {
    const data = await animeList()
    return NextResponse.json({ data: data }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
