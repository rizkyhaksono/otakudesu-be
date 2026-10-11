import { getTmdbToken } from "@/lib/shared/env";

/** Liveness probe used by the Docker healthcheck. Never cached. */
export async function GET() {
  const sources = {
    anime: Boolean(process.env.ANIME_BASE_URL || process.env.BASEURL),
    comic: true,
    movie: Boolean(getTmdbToken()),
    tv: true,
  };

  const degraded = Object.values(sources).some((configured) => !configured);

  return Response.json(
    {
      status: degraded ? "degraded" : "ok",
      sources,
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
