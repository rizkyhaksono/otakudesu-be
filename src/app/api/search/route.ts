import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ data: "You need to put [:keyword]" }, { status: 201 })
}
