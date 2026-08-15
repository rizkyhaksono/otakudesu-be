import schedule from "@/utils/anime/schedule";
import { apiHandler } from "@/lib/shared/apiHandler";

export async function GET() {
  return apiHandler(() => schedule(), { sMaxAge: 3600, staleWhileRevalidate: 7200 });
}
