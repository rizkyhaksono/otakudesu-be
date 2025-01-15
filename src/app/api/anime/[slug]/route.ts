import { NextResponse, NextRequest } from "next/server"
import anime from "@/utils/anime";

export async function GET(request: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  try {
    const data = await anime(params.slug)
    return NextResponse.json({ data: data }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
