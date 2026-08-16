import { identifyByUpload, identifyByUrl } from "@/utils/anime/identify";
import { apiHandler } from "@/lib/shared/apiHandler";
import { ValidationError } from "@/lib/shared/errors";
import { urlSchema, parse } from "@/lib/shared/validate";

export const dynamic = "force-dynamic";

/** Reverse image search by a remote image URL — trace.moe fetches it itself. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  // `parse` must run inside the apiHandler callback, not before it — that is
  // what turns a bad `?url=` into a 400 instead of an uncaught 500.
  return apiHandler(() => identifyByUrl(parse(urlSchema, params.get("url") ?? "", "url")), {
    sMaxAge: 0,
  });
}

/** Reverse image search by an uploaded file — bytes forwarded, never stored. */
export async function POST(request: Request) {
  return apiHandler(async () => {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      throw new ValidationError("Content-Type must be an image/* type");
    }

    const bytes = new Uint8Array(await request.arrayBuffer());
    return identifyByUpload(bytes, contentType);
  }, { sMaxAge: 0 });
}
