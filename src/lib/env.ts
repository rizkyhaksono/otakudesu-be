const SLUG_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

export function getBaseUrl(): string {
  const baseUrl = process.env.BASEURL?.trim();

  if (!baseUrl) {
    throw new Error("BASEURL is required. Set it in .env or the container environment.");
  }

  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error("BASEURL must be a valid absolute URL (e.g. https://otakudesu.blog/).");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("BASEURL must use http or https.");
  }

  return baseUrl.replace(/\/$/, "");
}

export function assertSlug(value: string, label = "slug"): string {
  const slug = value.trim();
  if (!slug || slug.includes("..") || slug.includes("/") || !SLUG_PATTERN.test(slug)) {
    throw new Error(`Invalid ${label}`);
  }
  return slug;
}
