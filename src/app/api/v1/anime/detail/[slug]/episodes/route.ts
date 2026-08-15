import episodes from "@/utils/anime/episodes";
import { apiHandler } from "@/lib/shared/apiHandler";
import { parse, slugSchema } from "@/lib/shared/validate";

export async function GET(_request: Request, props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  return apiHandler(() => episodes(parse(slugSchema, slug, "slug")), { sMaxAge: 1800 });
}
