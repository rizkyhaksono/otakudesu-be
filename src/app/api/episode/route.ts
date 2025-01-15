import { NextResponse, NextRequest } from "next/server"

export async function GET() {
  return NextResponse.json({ data: "You need to put [:slug]" }, { status: 404 })
}
