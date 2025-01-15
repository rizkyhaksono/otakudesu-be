import { NextResponse, NextRequest } from "next/server"

export async function GET() {
  return NextResponse.json({ data: "You need to add [:slug]" }, { status: 404 })
}
