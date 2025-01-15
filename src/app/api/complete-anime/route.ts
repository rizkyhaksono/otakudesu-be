import { NextResponse, NextRequest } from "next/server"

export async function GET() {
  return NextResponse.json({ data: "You have to add [:page]" }, { status: 404 })
}
