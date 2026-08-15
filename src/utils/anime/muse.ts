import { getMuseIndex, matchPlaylist, type MuseMatch } from "@/lib/anime/muse";

/**
 * Official fallback for an anime title. Returns `null` rather than a weak guess
 * — sending someone to the wrong series is worse than showing no fallback.
 */
const museFallback = async (title: string): Promise<MuseMatch | null> => {
  const playlists = await getMuseIndex();
  if (!playlists.length) return null;
  return matchPlaylist(title, playlists);
};

export default museFallback;
