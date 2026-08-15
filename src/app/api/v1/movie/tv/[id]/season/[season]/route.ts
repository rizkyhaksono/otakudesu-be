import movieSeason from "@/utils/movie/season";
import { apiHandler } from "@/lib/shared/apiHandler";
import { parse, seasonSchema, tmdbIdSchema } from "@/lib/shared/validate";

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string; season: string }> },
) {
  const params = await props.params;

  return apiHandler(
    () =>
      movieSeason(
        parse(tmdbIdSchema, params.id, "series id"),
        parse(seasonSchema, params.season, "season"),
      ),
    { sMaxAge: 3600 },
  );
}
