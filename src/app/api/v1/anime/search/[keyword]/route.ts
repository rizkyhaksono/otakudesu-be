import search from "@/utils/anime/search";
import { apiHandler } from "@/lib/shared/apiHandler";
import { keywordSchema, parse } from "@/lib/shared/validate";

export async function GET(_request: Request, props: { params: Promise<{ keyword: string }> }) {
  const { keyword } = await props.params;
  const decoded = decodeURIComponent(keyword);
  return apiHandler(() => search(parse(keywordSchema, decoded, "keyword")), { sMaxAge: 300 });
}
