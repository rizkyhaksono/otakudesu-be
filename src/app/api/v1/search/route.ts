import { omniSearch } from "@/utils/search";
import { apiHandler } from "@/lib/shared/apiHandler";
import { keywordSchema, parse } from "@/lib/shared/validate";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  return apiHandler(() => omniSearch(parse(keywordSchema, params.get("q") ?? "", "query")), {
    sMaxAge: 60,
    staleWhileRevalidate: 300,
  });
}
