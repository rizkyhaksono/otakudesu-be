import comicChapter from "@/utils/comic/chapter";
import { apiHandler } from "@/lib/shared/apiHandler";
import { chapterNumberSchema, parse, slugSchema } from "@/lib/shared/validate";

export async function GET(
  _request: Request,
  props: { params: Promise<{ slug: string; chapter: string }> },
) {
  const params = await props.params;

  return apiHandler(
    () =>
      comicChapter(
        parse(slugSchema, params.slug, "comic slug"),
        parse(chapterNumberSchema, params.chapter, "chapter"),
      ),
    { sMaxAge: 3600, staleWhileRevalidate: 86_400 },
  );
}
