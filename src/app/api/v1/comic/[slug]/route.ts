import comicDetail from "@/utils/comic/detail";
import { apiHandler } from "@/lib/shared/apiHandler";
import { parse, slugSchema } from "@/lib/shared/validate";

export async function GET(_request: Request, props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  return apiHandler(() => comicDetail(parse(slugSchema, slug, "comic slug")), { sMaxAge: 1800 });
}
