/** One entry from a source's official "where are we now" link list. */
export type MirrorLink = {
  title: string;
  href: string;
  /** The upstream's own icon hint, e.g. "globe" | "discord" | "coffee". */
  icon: string | null;
};

export type MirrorStatus = {
  /** The current site URL — always the first entry the upstream publishes. */
  current: string | null;
  /** Everything else they list: Discord, docs, donation, premium. */
  links: MirrorLink[];
  checkedAt: string;
};
