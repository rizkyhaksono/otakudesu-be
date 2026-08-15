export type TvStream = {
  url: string;
  quality: string | null;
  title: string | null;
  /** True when the stream needs custom request headers, so it cannot be played directly. */
  needs_proxy: boolean;
  user_agent: string | null;
  referrer: string | null;
  /** `null` until the background liveness pass has probed this stream. */
  alive: boolean | null;
};

export type TvChannel = {
  id: string;
  name: string;
  alt_names: string[];
  network: string | null;
  owners: string[];
  country: string;
  categories: string[];
  launched: string | null;
  website: string | null;
  logo: string | null;
  streams: TvStream[];
};

/** Public shape: request headers are never exposed to clients. */
export type TvChannelPublic = Omit<TvChannel, "streams"> & {
  streams: {
    quality: string | null;
    title: string | null;
    url: string | null;
    proxy_url: string;
  }[];
};

export type TvCategory = {
  slug: string;
  count: number;
};
