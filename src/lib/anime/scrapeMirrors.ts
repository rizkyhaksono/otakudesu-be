import { load } from "cheerio";
import type { episode_mirror } from "@/types/anime";

/**
 * Otakudesu episode pages carry a list of alternate streaming servers
 * ("mirrors") that the original scraper never captured — it only read the one
 * iframe that happens to be embedded on page load. When that single server is
 * down or geo-blocked, the episode looks broken even though several working
 * alternatives are listed right there.
 *
 * Each mirror is a link whose `data-content` holds base64 JSON of the form
 * `{ id, i, q }`. That payload is opaque to us: it is passed straight back to
 * the upstream to resolve into a real iframe URL (see `utils/anime/mirror.ts`).
 */
const scrapeMirrors = (html: string): episode_mirror[] => {
  const $ = load(html);
  const mirrors: episode_mirror[] = [];

  $(".mirrorstream ul").each((_, ul) => {
    // The <ul> class encodes the quality: m360p, m480p, m720p…
    const quality =
      ($(ul).attr("class") ?? "")
        .split(/\s+/)
        .find((name) => /^m\d+p$/.test(name))
        ?.slice(1) ?? null;

    $(ul)
      .find("a[data-content]")
      .each((__, anchor) => {
        const content = $(anchor).attr("data-content")?.trim();
        const provider = $(anchor).text().trim();
        if (!content || !provider) return;

        mirrors.push({ provider, quality, content });
      });
  });

  return mirrors;
};

export default scrapeMirrors;
