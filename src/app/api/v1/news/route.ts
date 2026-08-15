import { news } from "@/utils/news";
import { apiHandler } from "@/lib/shared/apiHandler";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  // `q` narrows the feed to the items about one title — used by anime pages.
  const q = params.get("q")?.slice(0, 120) ?? undefined;
  const limit = Math.min(Math.max(Number(params.get("limit")) || 0, 0), 100) || undefined;

  return apiHandler(() => news({ q, limit }), { sMaxAge: 1800, staleWhileRevalidate: 7200 });
}
