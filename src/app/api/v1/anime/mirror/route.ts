import mirror from "@/utils/anime/mirror";
import { apiHandler } from "@/lib/shared/apiHandler";
import { parse } from "@/lib/shared/validate";
import { z } from "zod";

// Base64 token taken verbatim from an episode's `mirrors[].content`.
const tokenSchema = z
  .string()
  .trim()
  .min(8)
  .max(512)
  .regex(/^[A-Za-z0-9+/=]+$/, "must be a base64 token");

export async function GET(request: Request) {
  const content = new URL(request.url).searchParams.get("content") ?? "";

  return apiHandler(() => mirror(parse(tokenSchema, content, "mirror token")), {
    sMaxAge: 600,
    staleWhileRevalidate: 3600,
  });
}
