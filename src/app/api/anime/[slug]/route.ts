import { NextResponse, NextRequest } from "next/server";
import otakudesu from "@/otakudesu";

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const data = await otakudesu.anime(params.slug);
    return NextResponse.json({ data: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}