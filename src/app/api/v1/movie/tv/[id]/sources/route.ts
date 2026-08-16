import { tvSources } from "@/lib/movie/providers";
import { apiHandler } from "@/lib/shared/apiHandler";
import { episodeSchema, parse, seasonSchema, tmdbIdSchema } from "@/lib/shared/validate";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const params = new URL(request.url).searchParams;

  return apiHandler(
    async () => {
      const tmdbId = parse(tmdbIdSchema, id, "series id");
      const season = parse(seasonSchema, params.get("season") ?? 1, "season");
      const episode = parse(episodeSchema, params.get("episode") ?? 1, "episode");

      return {
        media_type: "tv",
        id: tmdbId,
        season,
        episode,
        sources: tvSources(tmdbId, season, episode),
      };
    },
    { sMaxAge: 86_400 },
  );
}
