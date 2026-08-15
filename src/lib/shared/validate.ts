import { z } from "zod";
import { ValidationError } from "@/lib/shared/errors";

/**
 * Shared param schemas. Every route validates before touching an upstream, so
 * a malformed request fails as 400 here rather than as a 500 further down.
 */

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/, "must be a plain slug");

export const pageSchema = z.coerce.number().int().min(1).max(10_000);

export const chapterNumberSchema = z.coerce.number().min(0).max(100_000);

export const tmdbIdSchema = z.coerce.number().int().min(1).max(100_000_000);

export const seasonSchema = z.coerce.number().int().min(0).max(1_000);

export const episodeSchema = z.coerce.number().int().min(0).max(100_000);

export const keywordSchema = z.string().trim().min(1).max(100);

/** Channel ids in the iptv-org index look like `RCTI.id`. */
export const channelIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "must be a valid channel id");

/**
 * Run a schema and convert any failure into a `ValidationError`, so callers
 * never have to handle ZodError shapes themselves.
 */
export function parse<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const detail = result.error.issues[0]?.message ?? "is invalid";
    throw new ValidationError(`Invalid ${label}: ${detail}`);
  }
  return result.data;
}
