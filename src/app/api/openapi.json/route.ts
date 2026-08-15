import { NextResponse } from "next/server";
import { buildOpenApiDocument } from "@/lib/openapi";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  return NextResponse.json(buildOpenApiDocument(origin), {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
