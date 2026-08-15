import { discoverByGenre } from "@/utils/movie/genres";
import { apiHandler } from "@/lib/shared/apiHandler";
import { pageSchema, parse, tmdbIdSchema } from "@/lib/shared/validate";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const params = new URL(request.url).searchParams;
  const mediaType = params.get("type") === "tv" ? "tv" : "movie";

  return apiHandler(
    () =>
      discoverByGenre(
        parse(tmdbIdSchema, id, "genre id"),
        parse(pageSchema, params.get("page") ?? 1, "page"),
        mediaType,
      ),
    { sMaxAge: 3600 },
  );
}
