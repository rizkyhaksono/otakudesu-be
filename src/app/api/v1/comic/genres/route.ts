import comicGenres from "@/utils/comic/genres";
import { apiHandler } from "@/lib/shared/apiHandler";

export async function GET() {
  return apiHandler(() => comicGenres(), { sMaxAge: 86_400, staleWhileRevalidate: 172_800 });
}
