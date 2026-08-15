import { NextResponse } from "next/server";
import { getRadioIndex } from "@/lib/radio/browser";
import { isManifest } from "@/lib/tv/hlsProxy";
import { assertPublicUrl } from "@/lib/shared/ssrf";
import { toErrorResponse } from "@/lib/shared/apiHandler";
import { NotFoundError, UpstreamError } from "@/lib/shared/errors";
import { parse } from "@/lib/shared/validate";
import { z } from "zod";

export const dynamic = "force-dynamic";

const idSchema = z.string().trim().uuid();

const URI_ATTRIBUTE = /URI="([^"]+)"/g;

/**
 * Make every reference in an m3u8 absolute against the upstream manifest.
 *
 * Unlike the TV proxy this does not route segments back through us: radio HLS
 * is a small minority of stations and their segment hosts send permissive CORS.
 * Rewriting relative paths is still required — the browser would otherwise
 * resolve them against our own origin.
 */
function absolutizeManifest(manifest: string, manifestUrl: string): string {
  const absolute = (reference: string) => {
    const trimmed = reference.trim();
    if (!trimmed || trimmed.startsWith("#")) return reference;
    try {
      return new URL(trimmed, manifestUrl).toString();
    } catch {
      return reference;
    }
  };

  return manifest
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith("#")) {
        return line.replace(URI_ATTRIBUTE, (_, uri: string) => `URI="${absolute(uri)}"`);
      }
      return absolute(trimmed);
    })
    .join("\n");
}

/**
 * Audio proxy for stations the browser cannot play directly, usually because
 * the stream sends no CORS headers or still serves plain HTTP.
 *
 * Same SSRF posture as the TV proxy: the caller supplies only a station id and
 * the URL comes from the cached index, never from the request. Most radio
 * streams are continuous MP3/AAC, so the body is piped through untouched; the
 * handful that publish HLS reuse the TV manifest rewriter.
 */
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const stationId = parse(idSchema, id, "station id");

    const { byId } = await getRadioIndex();
    const station = byId.get(stationId);
    if (!station) throw new NotFoundError("Station not found");

    const target = await assertPublicUrl(station.stream);

    const upstream = await fetch(target.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; natee-radio/1.0)",
        Accept: "*/*",
        ...(request.headers.get("range") ? { Range: request.headers.get("range")! } : {}),
      },
      redirect: "follow",
      cache: "no-store",
      // No overall timeout: this is a continuous stream, not a document.
      signal: AbortSignal.timeout(20_000),
    });

    if (!upstream.ok && upstream.status !== 206) {
      throw UpstreamError.failed(target.toString(), upstream.status);
    }

    const contentType = upstream.headers.get("content-type");
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    };

    if (isManifest(contentType, target.toString())) {
      const body = await upstream.text();
      return new NextResponse(absolutizeManifest(body, upstream.url || target.toString()), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/vnd.apple.mpegurl" },
      });
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: { ...corsHeaders, "Content-Type": contentType ?? "audio/mpeg" },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return toErrorResponse(new UpstreamError("Stream request timed out", { status: 504 }));
    }
    if (error instanceof TypeError) {
      return toErrorResponse(new UpstreamError("Stream is unreachable"));
    }
    return toErrorResponse(error);
  }
}
