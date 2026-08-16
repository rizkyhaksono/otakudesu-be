import { movieSources } from "@/lib/movie/providers";
import { apiHandler } from "@/lib/shared/apiHandler";
import { parse, tmdbIdSchema } from "@/lib/shared/validate";

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  return apiHandler(
    async () => {
      const tmdbId = parse(tmdbIdSchema, id, "movie id");
      return { media_type: "movie", id: tmdbId, sources: movieSources(tmdbId) };
    },
    { sMaxAge: 86_400 },
  );
}
