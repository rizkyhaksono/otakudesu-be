/**
 * Domain errors. `apiHandler` is the only place that maps these to HTTP status
 * codes, so route handlers never build error responses themselves.
 */

export class ValidationError extends Error {
  readonly status = 400;
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  readonly status = 404;
  constructor(message = "Not Found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConfigError extends Error {
  readonly status = 500;
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class UpstreamError extends Error {
  readonly status: number;
  readonly upstreamStatus?: number;

  constructor(message: string, options: { status?: number; upstreamStatus?: number } = {}) {
    super(message);
    this.name = "UpstreamError";
    this.status = options.status ?? 502;
    this.upstreamStatus = options.upstreamStatus;
  }

  static timeout(url: string) {
    return new UpstreamError(`Upstream request timed out: ${safeLabel(url)}`, { status: 504 });
  }

  static failed(url: string, upstreamStatus: number) {
    if (upstreamStatus === 404) {
      return new NotFoundError();
    }
    return new UpstreamError(`Upstream request failed: ${safeLabel(url)}`, {
      status: 502,
      upstreamStatus,
    });
  }
}

/** Only expose the upstream origin + path, never query strings or credentials. */
function safeLabel(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return "unknown";
  }
}
