import { getTraceMoeUrl } from "@/lib/shared/env";
import { fetchJson, fetchRaw } from "@/lib/shared/http";
import { num, text } from "@/lib/shared/sanitize";
import { ValidationError } from "@/lib/shared/errors";
import type { SceneMatch, SceneSearchResult } from "@/types/tools";

/**
 * "Which anime is this from?" — reverse image search via trace.moe, the API
 * behind the open-source WhatAnime project. trace.moe fetches the remote image
 * itself for the URL path, so this server never downloads user-supplied media;
 * for the upload path the bytes are forwarded to trace.moe untouched and never
 * written to disk here.
 */

type RawMatch = {
  anilist?: { id?: number; title?: { native?: string; romaji?: string; english?: string } };
  filename?: string;
  episode?: number | string;
  from?: number;
  to?: number;
  similarity?: number;
  video?: string;
  image?: string;
};

function pickTitle(anilist: RawMatch["anilist"]): { title: string; native: string | null } {
  const romaji = text(anilist?.title?.romaji);
  const english = text(anilist?.title?.english);
  const native = text(anilist?.title?.native);
  // English first when it exists — this audience reads Latin script results
  // more easily than romaji, and romaji is what trace.moe defaults to.
  return { title: english ?? romaji ?? "Unknown", native };
}

function mapMatch(raw: RawMatch): SceneMatch | null {
  const similarity = num(raw.similarity);
  if (similarity === null) return null;

  const { title, native } = pickTitle(raw.anilist);

  return {
    similarity,
    anilistId: raw.anilist?.id ?? null,
    title,
    titleNative: native,
    episode: raw.episode !== undefined ? String(raw.episode) : null,
    from: num(raw.from) ?? 0,
    to: num(raw.to) ?? 0,
    preview: text(raw.video),
    image: text(raw.image),
  };
}

type RawResponse = { error?: string; result?: RawMatch[] };

function mapResult(raw: RawResponse, quotaRemaining: number | null): SceneSearchResult {
  if (raw.error) throw new ValidationError(raw.error);

  const matches = (raw.result ?? [])
    .map(mapMatch)
    .filter((match): match is SceneMatch => match !== null)
    // Best match first; a screenshot search is only useful sorted this way.
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10);

  return { matches, quotaRemaining };
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const identifyByUrl = async (imageUrl: string): Promise<SceneSearchResult> => {
  let target: URL;
  try {
    target = new URL(imageUrl);
  } catch {
    throw new ValidationError("Invalid image URL");
  }
  if (target.protocol !== "https:" && target.protocol !== "http:") {
    throw new ValidationError("Image URL must be http or https");
  }

  const search = new URL(`${getTraceMoeUrl()}/search`);
  search.searchParams.set("url", target.toString());
  search.searchParams.set("anilistInfo", "");

  const raw = await fetchJson<RawResponse>(search.toString(), { revalidate: 0, timeoutMs: 20_000 });
  return mapResult(raw, null);
};

export const identifyByUpload = async (
  bytes: Uint8Array,
  contentType: string,
): Promise<SceneSearchResult> => {
  if (bytes.byteLength === 0) throw new ValidationError("Empty image");
  if (bytes.byteLength > MAX_UPLOAD_BYTES) throw new ValidationError("Image too large (max 10 MB)");
  if (!contentType.startsWith("image/")) throw new ValidationError("File must be an image");

  const search = new URL(`${getTraceMoeUrl()}/search`);
  search.searchParams.set("anilistInfo", "");

  const response = await fetchRaw(search.toString(), {
    method: "POST",
    body: bytes,
    revalidate: 0,
    timeoutMs: 20_000,
    headers: { "Content-Type": contentType },
  });

  const raw = (await response.json()) as RawResponse;
  const quotaHeader = response.headers.get("x-ratelimit-remaining");
  return mapResult(raw, quotaHeader ? (num(quotaHeader) ?? null) : null);
};
