import { NextResponse, NextRequest } from "next/server"

export async function GET() {
  try {
    return NextResponse.json({ data: "You need to put [:slug]" }, { status: 404 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
