import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { page: number } }) {
  try {
    return NextResponse.json({ data: "You have to add [:page]" }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}