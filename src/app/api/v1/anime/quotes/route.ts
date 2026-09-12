import { NextResponse } from "next/server";
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

  // `apiHandler` maps `null` to 404 + no-store. A missing quote is normal, not
  // an error, and the homepage must stay cacheable either way.
  const quote = await randomQuote();
  return NextResponse.json(
    { data: quote },
    {
      status: 200,
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    },
  );
}
