import batch from "@/utils/anime/batch";
import { apiHandler } from "@/lib/shared/apiHandler";
import { parse, slugSchema } from "@/lib/shared/validate";

export async function GET(_request: Request, props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  return apiHandler(() => batch({ batchSlug: parse(slugSchema, slug, "slug") }), {
    sMaxAge: 3600,
  });
}
