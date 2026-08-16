import movieList, { MOVIE_CATEGORIES, type MovieCategory } from "@/utils/movie/list";
import { apiHandler } from "@/lib/shared/apiHandler";
import { pageSchema, parse } from "@/lib/shared/validate";
import { ValidationError } from "@/lib/shared/errors";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  return apiHandler(() => {
    const category = params.get("category") ?? "trending";
    if (!MOVIE_CATEGORIES.includes(category as MovieCategory)) {
      throw new ValidationError(`Invalid category. Use one of: ${MOVIE_CATEGORIES.join(", ")}`);
    }

    const page = parse(pageSchema, params.get("page") ?? 1, "page");
    return movieList(category as MovieCategory, page);
  }, { sMaxAge: 3600 });
}
