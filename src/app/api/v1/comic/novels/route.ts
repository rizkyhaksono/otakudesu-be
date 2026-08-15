import comicNovels from "@/utils/comic/novels";
import { apiHandler } from "@/lib/shared/apiHandler";
import { keywordSchema, pageSchema, parse } from "@/lib/shared/validate";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const page = parse(pageSchema, params.get("page") ?? 1, "page");
  const rawSearch = params.get("q");
  const search = rawSearch ? parse(keywordSchema, rawSearch, "query") : undefined;

  return apiHandler(() => comicNovels({ page, search }), { sMaxAge: search ? 300 : 1800 });
}
