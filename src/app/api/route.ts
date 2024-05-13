import { NextResponse, NextRequest } from "next/server"

export async function GET() {
  try {
    return NextResponse.json(
      [
        {
          message: "Otakudesu unofficial API, made by rizkyhaksono with 🤍",
          GitHub: "https://github.com/rizkyhaksono",
          Support: "https://saweria.co/natee",
        },
      ],
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
