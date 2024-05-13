import { NextResponse, NextRequest } from "next/server"
import otakudesu from "@/otakudesu"
import { revalidatePath } from "next/cache"

export async function GET() {
  try {
    const data = await otakudesu.home()
    revalidatePath("/api/home", "page")
    return NextResponse.json({ data: data }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
