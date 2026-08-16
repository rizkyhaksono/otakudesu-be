import { getAnimeChanUrl } from "@/lib/shared/env";
import { fetchJson } from "@/lib/shared/http";
import { text } from "@/lib/shared/sanitize";
import type { AnimeQuote } from "@/types/tools";

/**
 * Anime quotes from AnimeChan — an open, public quote dataset. Read-only and
 * unauthenticated, same posture as the news feed: a nice-to-have that must
 * degrade quietly if the upstream is ever unreachable.
 */

type RawQuote = {
  content?: string;
  anime?: { name?: string };
  character?: { name?: string };
};

function mapQuote(raw: RawQuote): AnimeQuote | null {
  const content = text(raw.content);
  const anime = text(raw.anime?.name);
  const character = text(raw.character?.name);
  if (!content || !anime) return null;
  return { content, anime, character: character ?? "?" };
}

export const randomQuote = async (): Promise<AnimeQuote | null> => {
  const raw = await fetchJson<{ data?: RawQuote }>(`${getAnimeChanUrl()}/quotes/random`, {
    revalidate: 0, // a cached "random" quote would never rotate
    timeoutMs: 8_000,
  });
  return mapQuote(raw.data ?? {});
};

/**
 * Quotes from a specific title — used to enrich an anime's detail page.
 *
 * A title with no quotes in the dataset is the normal case, not a failure:
 * the upstream answers with a 404 for that, which `fetchJson` turns into a
 * thrown error. Swallowing it here keeps a routine "nothing found" from
 * looking like an outage everywhere else in the call chain.
 */
export const quotesFor = async (animeTitle: string, limit = 5): Promise<AnimeQuote[]> => {
  const url = new URL(`${getAnimeChanUrl()}/quotes`);
  url.searchParams.set("anime", animeTitle);

  try {
    const raw = await fetchJson<{ data?: RawQuote[] }>(url.toString(), {
      revalidate: 21_600,
      timeoutMs: 8_000,
    });

    return (raw.data ?? [])
      .map(mapQuote)
      .filter((quote): quote is AnimeQuote => quote !== null)
      .slice(0, limit);
  } catch {
    return [];
  }
};
