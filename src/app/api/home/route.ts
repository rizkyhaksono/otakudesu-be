import { NextResponse, NextRequest } from "next/server"
import home from "@/utils/home"

export async function GET() {
  const data = await home()
  return NextResponse.json({ data: data }, { status: 200 })
}
