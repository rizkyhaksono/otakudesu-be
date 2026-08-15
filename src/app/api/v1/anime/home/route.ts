import home from "@/utils/anime/home";
import { apiHandler } from "@/lib/shared/apiHandler";

export async function GET() {
  return apiHandler(() => home(), { sMaxAge: 300, staleWhileRevalidate: 900 });
}
