import search from "@/utils/anime/search";
import { apiHandler } from "@/lib/shared/apiHandler";
import { keywordSchema, parse } from "@/lib/shared/validate";

export async function GET(_request: Request, props: { params: Promise<{ keyword: string }> }) {
  const { keyword } = await props.params;
  // Hono hands params over already decoded; decoding again would throw on a literal "%".
  return apiHandler(() => search(parse(keywordSchema, keyword, "keyword")), { sMaxAge: 300 });
}
