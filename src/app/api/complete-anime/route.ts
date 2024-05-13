import { NextResponse, NextRequest } from "next/server"

export async function GET(respose: NextResponse, request: NextRequest) {
  try {
    return NextResponse.json({ data: "You have to add [:page]" }, { status: 404 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
