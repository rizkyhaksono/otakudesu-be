import episode from "@/utils/anime/episode";
import { apiHandler } from "@/lib/shared/apiHandler";
import { parse, slugSchema } from "@/lib/shared/validate";

export async function GET(_request: Request, props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  return apiHandler(() => episode({ episodeSlug: parse(slugSchema, slug, "slug") }), {
    sMaxAge: 600,
  });
}
