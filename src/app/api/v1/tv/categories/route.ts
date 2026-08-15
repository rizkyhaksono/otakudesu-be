import { tvCategories } from "@/utils/tv/channels";
import { apiHandler } from "@/lib/shared/apiHandler";

export async function GET() {
  return apiHandler(() => tvCategories(), { sMaxAge: 21_600, staleWhileRevalidate: 43_200 });
}
