import { newsArticle } from "@/utils/news";
import { apiHandler } from "@/lib/shared/apiHandler";
import { parse } from "@/lib/shared/validate";
import { z } from "zod";

const idSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]{1,20}$/, "Invalid article id");

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return apiHandler(() => newsArticle(parse(idSchema, id, "article id")), {
    sMaxAge: 86_400,
    staleWhileRevalidate: 172_800,
  });
}
