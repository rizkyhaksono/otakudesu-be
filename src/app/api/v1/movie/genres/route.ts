import { movieGenres } from "@/utils/movie/genres";
import { apiHandler } from "@/lib/shared/apiHandler";

export async function GET() {
  return apiHandler(() => movieGenres(), { sMaxAge: 86_400, staleWhileRevalidate: 172_800 });
}
