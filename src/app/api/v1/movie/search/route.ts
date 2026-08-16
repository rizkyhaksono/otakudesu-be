import movieSearch from "@/utils/movie/search";
import { apiHandler } from "@/lib/shared/apiHandler";
import { keywordSchema, pageSchema, parse } from "@/lib/shared/validate";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  return apiHandler(() => {
    const query = parse(keywordSchema, params.get("q") ?? "", "query");
    const page = parse(pageSchema, params.get("page") ?? 1, "page");
    return movieSearch(query, page);
  }, { sMaxAge: 300 });
}
