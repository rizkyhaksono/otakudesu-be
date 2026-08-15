import movieDetail from "@/utils/movie/detail";
import { apiHandler } from "@/lib/shared/apiHandler";
import { parse, tmdbIdSchema } from "@/lib/shared/validate";

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return apiHandler(() => movieDetail(parse(tmdbIdSchema, id, "movie id"), "movie"), {
    sMaxAge: 3600,
  });
}
