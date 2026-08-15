import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, clientKey, rateLimitHeaders } from "@/lib/shared/rateLimit";

/**
 * Renamed from `middleware` in Next.js 16. Runs on the Node.js runtime, in the
 * same process as the route handlers, so the in-memory rate limiter is shared.
 *
 * Every request here fans out to a third-party site; without a limit a single
 * client can get this server's IP banned upstream.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Health checks must never be throttled — the container probe depends on it.
  if (pathname === "/api/health") return NextResponse.next();

  const result = checkRateLimit(clientKey(request));
  const headers = rateLimitHeaders(result);

  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too Many Requests" },
      {
        status: 429,
        headers: { ...headers, "Cache-Control": "no-store" },
      },
    );
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
