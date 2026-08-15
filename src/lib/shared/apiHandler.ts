import { NextResponse } from "next/server";
import { ConfigError, NotFoundError, UpstreamError, ValidationError } from "@/lib/shared/errors";

export type ApiHandlerOptions = {
  /** Seconds a CDN may serve this response from cache. */
  sMaxAge?: number;
  /** Seconds a stale response may still be served while revalidating. */
  staleWhileRevalidate?: number;
};

const DEFAULT_S_MAXAGE = 300;
const DEFAULT_SWR = 600;

/**
 * The single place that turns a domain function into an HTTP response.
 *
 * Success is always `{ data }`; failure is always `{ error }`. Route handlers
 * never construct either shape themselves, which is what keeps the public API
 * consistent across all four domains.
 */
export async function apiHandler<T>(
  fn: () => Promise<T>,
  options: ApiHandlerOptions = {},
): Promise<NextResponse> {
  const { sMaxAge = DEFAULT_S_MAXAGE, staleWhileRevalidate = DEFAULT_SWR } = options;

  try {
    const data = await fn();

    if (data === undefined || data === null || data === false) {
      return errorResponse("Not Found", 404);
    }

    return NextResponse.json(
      { data },
      {
        status: 200,
        headers: {
          "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
        },
      },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}

export function toErrorResponse(error: unknown): NextResponse {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof UpstreamError ||
    error instanceof ConfigError
  ) {
    return errorResponse(error.message, error.status);
  }

  // Anything unrecognised is a bug on our side: log it, but never leak the
  // stack or upstream internals to the caller.
  console.error("[apiHandler] unhandled error", error);
  return errorResponse("Internal Server Error", 500);
}

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
