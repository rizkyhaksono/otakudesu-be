import { tvChannels } from "@/utils/tv/channels";
import { apiHandler } from "@/lib/shared/apiHandler";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const category = params.get("category")?.slice(0, 40) ?? undefined;
  const q = params.get("q")?.slice(0, 80) ?? undefined;

  return apiHandler(() => tvChannels({ category, q }), {
    sMaxAge: 300,
    staleWhileRevalidate: 600,
  });
}
