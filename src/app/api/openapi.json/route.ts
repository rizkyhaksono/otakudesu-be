import { buildOpenApiDocument } from "@/lib/openapi";
import { publicOrigin } from "@/lib/shared/publicOrigin";

export async function GET(request: Request) {
  return Response.json(buildOpenApiDocument(publicOrigin(request)), {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
