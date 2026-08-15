import comicBrowse from "@/utils/comic/browse";
import { apiHandler } from "@/lib/shared/apiHandler";
import { keywordSchema, pageSchema, parse, slugSchema } from "@/lib/shared/validate";

const TYPES = ["Manga", "Manhwa", "Manhua"];
const SORTS = ["latest", "popular"];

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const page = parse(pageSchema, params.get("page") ?? 1, "page");
  const rawGenre = params.get("genre");
  const rawSearch = params.get("q");

  const genre = rawGenre ? parse(slugSchema, rawGenre, "genre") : undefined;
  const search = rawSearch ? parse(keywordSchema, rawSearch, "query") : undefined;

  // Allowlisted rather than passed through: these go straight into an upstream
  // query string, and the set of valid values is small and known.
  const rawType = params.get("type");
  const type = TYPES.includes(rawType ?? "") ? rawType! : undefined;
  const rawSort = params.get("sort");
  const sort = SORTS.includes(rawSort ?? "") ? rawSort! : undefined;

  return apiHandler(() => comicBrowse({ page, genre, search, type, sort }), {
    sMaxAge: search ? 300 : 1800,
  });
}
