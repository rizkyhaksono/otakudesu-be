import { NextResponse, NextRequest } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({ data: "You need to put [:episode]" }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}