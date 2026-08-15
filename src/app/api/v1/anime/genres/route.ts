import genreLists from "@/utils/anime/genreLists";
import { apiHandler } from "@/lib/shared/apiHandler";

export async function GET() {
  return apiHandler(() => genreLists(), { sMaxAge: 86_400, staleWhileRevalidate: 172_800 });
}
