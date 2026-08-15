export type RadioStation = {
  id: string;
  name: string;
  /** Direct stream URL; may be MP3/AAC or an HLS playlist. */
  stream: string;
  favicon: string | null;
  tags: string[];
  codec: string | null;
  bitrate: number | null;
  /** Upstream click count, used for ordering. */
  popularity: number;
  homepage: string | null;
  state: string | null;
  language: string | null;
};

export type RadioTag = { slug: string; count: number };
