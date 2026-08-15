import { NextResponse } from "next/server";
import { getIndex } from "@/lib/tv/iptv";
import { isManifest, resolveSignedTarget, rewriteManifest } from "@/lib/tv/hlsProxy";
import { assertPublicUrl } from "@/lib/shared/ssrf";
import { toErrorResponse } from "@/lib/shared/apiHandler";
import { NotFoundError, UpstreamError } from "@/lib/shared/errors";
import { channelIdSchema, parse } from "@/lib/shared/validate";
import { z } from "zod";

export const dynamic = "force-dynamic";

const streamIndexSchema = z.coerce.number().int().min(0).max(63);

/**
 * HLS proxy for channels whose streams cannot be played directly from the
 * browser (missing CORS headers, or a required User-Agent / Referer).
 *
 * Two modes:
 *   ?s=<index>            → look the stream URL up in the channel index and
 *                           return a rewritten manifest
 *   ?s=<index>&u=…&sig=…  → fetch one signed segment/playlist URL
 *
 * The caller can never supply an unsigned URL, so this is not an open proxy.
 */
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const channelId = parse(channelIdSchema, id, "channel id");
    const params = new URL(request.url).searchParams;
    const streamIndex = parse(streamIndexSchema, params.get("s") ?? 0, "stream");

    const { byId } = await getIndex();
    const channel = byId.get(channelId);
    if (!channel) throw new NotFoundError("Channel not found");

    const stream = channel.streams[streamIndex];
    if (!stream) throw new NotFoundError("Stream not found");

    const signedUrl = params.get("u");
    const signature = params.get("sig");

    // Mode 2: a signed URL discovered inside a manifest we previously served.
    // Mode 1: the channel's own stream URL, straight from the index.
    const target = signedUrl
      ? await resolveSignedTarget(signedUrl, signature ?? "")
      : await assertPublicUrl(stream.url);

    const upstreamHeaders: Record<string, string> = {
      "User-Agent":
        stream.user_agent ??
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      Accept: "*/*",
    };
    if (stream.referrer) {
      upstreamHeaders.Referer = stream.referrer;
      upstreamHeaders.Origin = new URL(stream.referrer).origin;
    }

    const range = request.headers.get("range");
    if (range) upstreamHeaders.Range = range;

    const upstream = await fetch(target.toString(), {
      headers: upstreamHeaders,
      redirect: "follow",
      cache: "no-store",
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
      const rewritten = rewriteManifest(body, upstream.url || target.toString(), channelId, streamIndex);

      return new NextResponse(rewritten, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/vnd.apple.mpegurl",
        },
      });
    }

    // Media segments are streamed through untouched so we never buffer them.
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType ?? "video/mp2t",
        ...(upstream.headers.get("content-length")
          ? { "Content-Length": upstream.headers.get("content-length")! }
          : {}),
        ...(upstream.headers.get("content-range")
          ? { "Content-Range": upstream.headers.get("content-range")! }
          : {}),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return toErrorResponse(new UpstreamError("Stream request timed out", { status: 504 }));
    }
    if (error instanceof TypeError) {
      // fetch() network failure — do not leak the underlying message.
      return toErrorResponse(new UpstreamError("Stream is unreachable"));
    }
    return toErrorResponse(error);
  }
}
