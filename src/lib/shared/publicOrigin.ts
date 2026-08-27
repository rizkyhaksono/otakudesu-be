/**
 * The origin a client actually reached us on.
 *
 * `new URL(request.url).origin` is wrong behind a reverse proxy: the standalone
 * server binds to `0.0.0.0:3000`, so that is literally what it reports, and the
 * OpenAPI document ended up advertising `https://0.0.0.0:3000` as its server —
 * every "try it" button in the docs pointed at an unreachable address.
 *
 * nginx-proxy-manager (and every other sane proxy) sends the real values in
 * `x-forwarded-*`. Those headers are only trustworthy because this service is
 * never exposed directly — it only ever receives traffic through that proxy.
 */
export function publicOrigin(request: Request): string {
  const headers = request.headers;

  const forwardedHost = headers.get("x-forwarded-host") ?? headers.get("host");
  const forwardedProto = headers.get("x-forwarded-proto");

  if (forwardedHost) {
    // A proxy chain can send a comma-separated list; the first entry is the
    // original client-facing value.
    const host = forwardedHost.split(",")[0]!.trim();
    const proto = (forwardedProto?.split(",")[0] ?? "").trim() || inferProto(host);
    if (host) return `${proto}://${host}`;
  }

  const fallback = process.env.API_PUBLIC_URL?.replace(/\/+$/, "");
  if (fallback) return fallback;

  return new URL(request.url).origin;
}

/** Localhost is the only case where plain http is the sensible default. */
function inferProto(host: string): string {
  return /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host) ? "http" : "https";
}
