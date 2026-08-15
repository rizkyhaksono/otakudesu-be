import completeAnime from "@/utils/anime/completeAnime";
import { apiHandler } from "@/lib/shared/apiHandler";
import { pageSchema, parse } from "@/lib/shared/validate";

export async function GET(_request: Request, props: { params: Promise<{ page: string }> }) {
  const { page } = await props.params;
  return apiHandler(() => completeAnime(parse(pageSchema, page, "page")), { sMaxAge: 300 });
}
