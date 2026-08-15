import { readFileSync } from "node:fs";
import { join } from "node:path";

const FIXTURES = join(import.meta.dir, "fixtures");

/**
 * Fixtures are checked-in snapshots of upstream pages, so the unit suite never
 * touches the network. `bun run test:live` is the separate, opt-in suite that
 * hits the real sites to detect broken selectors.
 */
export function fixture(name: string): string {
  return readFileSync(join(FIXTURES, name), "utf8");
}

export const ANIME_BASE_URL = "https://otakudesu.blog";
