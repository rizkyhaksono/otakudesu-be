import { NextResponse } from "next/server";
import { buildOpenApiDocument } from "@/lib/openapi";
import { publicOrigin } from "@/lib/shared/publicOrigin";

export async function GET(request: Request) {
  return NextResponse.json(buildOpenApiDocument(publicOrigin(request)), {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
