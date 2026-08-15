/**
 * Everything scraped from an upstream site is untrusted input.
 *
 * Some upstreams embed raw HTML in text fields (kiryuuid.net ships `<p>` tags
 * inside novel synopses), so text is stripped here — at the mapper boundary in
 * the backend — rather than in each consumer. That way the public API and every
 * client are protected by the same single fix.
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”",
};

export function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => safeCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => safeCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (match, name) => NAMED_ENTITIES[name.toLowerCase()] ?? match);
}

function safeCodePoint(code: number): string {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return "";
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}

/**
 * Strip tags and collapse whitespace. Script and style bodies are dropped
 * entirely so their contents never leak into the output as text.
 */
export function stripHtml(value: unknown): string {
  if (typeof value !== "string" || !value) return "";

  return decodeEntities(
    value
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t ]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Trim a value to a plain string, or `null` when it is absent/blank. */
export function text(value: unknown): string | null {
  const cleaned = stripHtml(value);
  return cleaned || null;
}

/** Parse a number defensively; returns `null` rather than `NaN`. */
export function num(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Only allow absolute http(s) URLs through to clients. Protocol-relative URLs
 * are upgraded to https; anything else (javascript:, data:, …) becomes `null`.
 */
export function url(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  const candidate = raw.startsWith("//") ? `https:${raw}` : raw;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}
