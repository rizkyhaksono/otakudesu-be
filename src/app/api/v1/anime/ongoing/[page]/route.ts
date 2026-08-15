import ongoingAnime from "@/utils/anime/ongoingAnime";
import { apiHandler } from "@/lib/shared/apiHandler";
import { pageSchema, parse } from "@/lib/shared/validate";

export async function GET(_request: Request, props: { params: Promise<{ page: string }> }) {
  const { page } = await props.params;
  return apiHandler(() => ongoingAnime(parse(pageSchema, page, "page")), { sMaxAge: 300 });
}
