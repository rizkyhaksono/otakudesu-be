import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json([{
    message: "Otakudesu unofficial API, made by rizkyhaksono with 🤍",
    GitHub: "https://github.com/rizkyhaksono",
    Support: "https://saweria.co/natee",
  },],
    { status: 200 }
  )
}
