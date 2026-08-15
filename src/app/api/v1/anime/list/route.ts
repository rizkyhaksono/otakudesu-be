import animeList from "@/utils/anime/animeList";
import { apiHandler } from "@/lib/shared/apiHandler";

export async function GET() {
  return apiHandler(() => animeList(), { sMaxAge: 86_400, staleWhileRevalidate: 172_800 });
}
