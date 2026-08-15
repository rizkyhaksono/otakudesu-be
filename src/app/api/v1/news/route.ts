import { news } from "@/utils/news";
import { apiHandler } from "@/lib/shared/apiHandler";

export async function GET() {
  return apiHandler(() => news(), { sMaxAge: 1800, staleWhileRevalidate: 7200 });
}
