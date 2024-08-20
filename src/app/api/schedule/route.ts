import { NextResponse } from "next/server"
import otakudesu from "@/otakudesu"


export async function GET() {
  try {
    const data = await otakudesu.schedule()
    return NextResponse.json({ data: data }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
