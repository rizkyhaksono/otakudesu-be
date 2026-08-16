import comicNovels from "@/utils/comic/novels";
import { apiHandler } from "@/lib/shared/apiHandler";
import { keywordSchema, pageSchema, parse } from "@/lib/shared/validate";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const rawSearch = params.get("q");

  return apiHandler(
    () => {
      const page = parse(pageSchema, params.get("page") ?? 1, "page");
      const search = rawSearch ? parse(keywordSchema, rawSearch, "query") : undefined;
      return comicNovels({ page, search });
    },
    { sMaxAge: rawSearch ? 300 : 1800 },
  );
}
