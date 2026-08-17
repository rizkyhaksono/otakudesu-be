import { animeThemes } from "@/utils/anime/themes";
import { apiHandler } from "@/lib/shared/apiHandler";
import { keywordSchema, parse } from "@/lib/shared/validate";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  return apiHandler(() => animeThemes(parse(keywordSchema, params.get("title") ?? "", "title")), {
    sMaxAge: 21_600,
    staleWhileRevalidate: 43_200,
  });
}
