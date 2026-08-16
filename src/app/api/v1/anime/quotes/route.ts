import { quotesFor, randomQuote } from "@/utils/anime/quotes";
import { apiHandler } from "@/lib/shared/apiHandler";
import { keywordSchema, parse } from "@/lib/shared/validate";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const anime = params.get("anime");

  if (anime) {
    return apiHandler(() => quotesFor(parse(keywordSchema, anime, "anime")), {
      sMaxAge: 21_600,
      staleWhileRevalidate: 43_200,
    });
  }

  return apiHandler(() => randomQuote(), { sMaxAge: 0 });
}
