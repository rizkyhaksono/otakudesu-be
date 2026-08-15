import museFallback from "@/utils/anime/muse";
import { apiHandler } from "@/lib/shared/apiHandler";
import { keywordSchema, parse } from "@/lib/shared/validate";

export async function GET(request: Request) {
  const title = new URL(request.url).searchParams.get("title") ?? "";

  return apiHandler(() => museFallback(parse(keywordSchema, title, "title")), {
    sMaxAge: 21_600,
    staleWhileRevalidate: 43_200,
  });
}
