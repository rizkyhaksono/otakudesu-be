import comicBrowse from "@/utils/comic/browse";
import { apiHandler } from "@/lib/shared/apiHandler";
import { keywordSchema, pageSchema, parse, slugSchema } from "@/lib/shared/validate";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const page = parse(pageSchema, params.get("page") ?? 1, "page");
  const rawGenre = params.get("genre");
  const rawSearch = params.get("q");

  const genre = rawGenre ? parse(slugSchema, rawGenre, "genre") : undefined;
  const search = rawSearch ? parse(keywordSchema, rawSearch, "query") : undefined;

  return apiHandler(() => comicBrowse({ page, genre, search }), {
    sMaxAge: search ? 300 : 1800,
  });
}
