import animeByGenre from "@/utils/anime/animeByGenre";
import { apiHandler } from "@/lib/shared/apiHandler";
import { pageSchema, parse, slugSchema } from "@/lib/shared/validate";

export async function GET(request: Request, props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const rawPage = new URL(request.url).searchParams.get("page") ?? 1;

  return apiHandler(
    () => animeByGenre(parse(slugSchema, slug, "genre"), parse(pageSchema, rawPage, "page")),
    { sMaxAge: 1800 },
  );
}
