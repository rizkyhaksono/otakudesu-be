import { describe, expect, test } from "bun:test";
import { normalizeReferrer } from "@/lib/tv/iptv";

describe("normalizeReferrer", () => {
  test("adds a scheme to a bare host from iptv-org", () => {
    expect(normalizeReferrer("salamtelevisi.com")).toBe("https://salamtelevisi.com/");
    expect(normalizeReferrer("dens.tv/tv-local")).toBe("https://dens.tv/tv-local");
  });

  test("keeps a full URL", () => {
    expect(normalizeReferrer("http://example.com/x")).toBe("http://example.com/x");
  });

  test("drops what cannot become a URL", () => {
    expect(normalizeReferrer(null)).toBeNull();
    expect(normalizeReferrer("not a host")).toBeNull();
  });
});
