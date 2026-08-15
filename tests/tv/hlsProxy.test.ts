import { describe, expect, test } from "bun:test";
import { isManifest, resolveSignedTarget, rewriteManifest, sign, verify } from "@/lib/tv/hlsProxy";

const MANIFEST_URL = "https://cdn.test/live/master.m3u8";

describe("signing", () => {
  test("verifies its own signature", () => {
    const url = "https://cdn.test/seg1.ts";
    expect(verify(url, sign(url))).toBe(true);
  });

  test("rejects a mutated URL", () => {
    const signature = sign("https://cdn.test/seg1.ts");
    expect(verify("https://evil.test/seg1.ts", signature)).toBe(false);
  });

  test("rejects an empty or malformed signature", () => {
    expect(verify("https://cdn.test/seg1.ts", "")).toBe(false);
    expect(verify("https://cdn.test/seg1.ts", "short")).toBe(false);
  });
});

describe("resolveSignedTarget", () => {
  test("refuses an unsigned internal URL — the SSRF case", async () => {
    await expect(resolveSignedTarget("http://169.254.169.254/latest/meta-data/", "")).rejects.toThrow();
    await expect(resolveSignedTarget("http://127.0.0.1:3000/api/health", "forged")).rejects.toThrow();
  });

  test("refuses a correctly signed *private* URL — the second layer", async () => {
    const internal = "http://127.0.0.1:3000/api/health";
    await expect(resolveSignedTarget(internal, sign(internal))).rejects.toThrow();
  });
});

describe("rewriteManifest", () => {
  test("routes segments through the proxy and signs them", () => {
    const manifest = ["#EXTM3U", "#EXTINF:6.0,", "seg1.ts", "#EXTINF:6.0,", "seg2.ts"].join("\n");
    const result = rewriteManifest(manifest, MANIFEST_URL, "TVRI.id", 0);

    expect(result).toContain("/api/v1/tv/channels/TVRI.id/stream?");
    expect(result.match(/sig=/g)).toHaveLength(2);
    expect(result).not.toContain("\nseg1.ts");
  });

  test("rewrites URI attributes so encryption keys cannot bypass the proxy", () => {
    const manifest = ['#EXT-X-KEY:METHOD=AES-128,URI="key.bin"', "seg1.ts"].join("\n");
    const result = rewriteManifest(manifest, MANIFEST_URL, "TVRI.id", 0);

    expect(result).toContain('URI="/api/v1/tv/channels/TVRI.id/stream?');
    expect(result).not.toContain('URI="key.bin"');
  });

  test("resolves absolute and relative references alike", () => {
    const manifest = ["https://other.test/a.ts", "/root/b.ts"].join("\n");
    const result = rewriteManifest(manifest, MANIFEST_URL, "X.id", 1);

    expect(result).toContain(encodeURIComponent("https://other.test/a.ts"));
    expect(result).toContain(encodeURIComponent("https://cdn.test/root/b.ts"));
  });

  test("leaves comment lines without URIs untouched", () => {
    const result = rewriteManifest("#EXT-X-VERSION:3", MANIFEST_URL, "X.id", 0);
    expect(result).toBe("#EXT-X-VERSION:3");
  });
});

describe("isManifest", () => {
  test("detects by content type or extension", () => {
    expect(isManifest("application/vnd.apple.mpegurl", "https://a.test/x")).toBe(true);
    expect(isManifest(null, "https://a.test/x.m3u8?token=1")).toBe(true);
    expect(isManifest("video/mp2t", "https://a.test/x.ts")).toBe(false);
  });
});
