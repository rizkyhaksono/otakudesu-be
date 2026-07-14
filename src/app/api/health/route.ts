import { NextResponse } from "next/server"

export async function GET() {
  const hasBaseUrl = Boolean(process.env.BASEURL?.trim())

  return NextResponse.json(
    {
      status: hasBaseUrl ? "ok" : "degraded",
      baseurl_configured: hasBaseUrl,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  )
}
