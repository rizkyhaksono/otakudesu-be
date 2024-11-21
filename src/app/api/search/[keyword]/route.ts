import { NextResponse, NextRequest } from "next/server"
import otakudesu from "@/otakudesu"

export async function GET(request: NextRequest, props: { params: Promise<{ keyword: string }> }) {
  const params = await props.params;
  try {
    const data = await otakudesu.search(params.keyword)
    return NextResponse.json({ data: data }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
