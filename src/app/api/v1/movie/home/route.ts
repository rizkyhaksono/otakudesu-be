import movieHome from "@/utils/movie/home";
import { apiHandler } from "@/lib/shared/apiHandler";

export async function GET() {
  return apiHandler(() => movieHome(), { sMaxAge: 3600, staleWhileRevalidate: 7200 });
}
