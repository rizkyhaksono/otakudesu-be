import comicHome from "@/utils/comic/home";
import { apiHandler } from "@/lib/shared/apiHandler";

export async function GET() {
  return apiHandler(() => comicHome(), { sMaxAge: 300, staleWhileRevalidate: 900 });
}
