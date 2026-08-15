import { radioStations } from "@/utils/radio/stations";
import { apiHandler } from "@/lib/shared/apiHandler";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const tag = params.get("tag")?.slice(0, 40) ?? undefined;
  const q = params.get("q")?.slice(0, 80) ?? undefined;

  return apiHandler(() => radioStations({ tag, q }), {
    sMaxAge: 21_600,
    staleWhileRevalidate: 43_200,
  });
}
