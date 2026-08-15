import episode from "@/utils/anime/episode";
import { apiHandler } from "@/lib/shared/apiHandler";
import { episodeSchema, parse, slugSchema } from "@/lib/shared/validate";

export async function GET(
  _request: Request,
  props: { params: Promise<{ slug: string; episode: string }> },
) {
  const params = await props.params;

  return apiHandler(
    () =>
      episode({
        animeSlug: parse(slugSchema, params.slug, "slug"),
        episodeNumber: parse(episodeSchema, params.episode, "episode"),
      }),
    { sMaxAge: 600 },
  );
}
