import { describe, expect, test } from "bun:test";
import { assertPublicUrl, __internal } from "@/lib/shared/ssrf";

const { isBlockedV4, isBlockedV6 } = __internal;

describe("private address detection", () => {
  test("blocks the ranges an SSRF would target", () => {
    for (const address of [
      "127.0.0.1",
      "10.1.2.3",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "169.254.169.254", // cloud metadata
      "0.0.0.0",
      "100.64.0.1",
    ]) {
      expect(isBlockedV4(address)).toBe(true);
    }
  });

  test("allows ordinary public addresses", () => {
    for (const address of ["8.8.8.8", "1.1.1.1", "104.21.28.235", "172.32.0.1"]) {
      expect(isBlockedV4(address)).toBe(false);
    }
  });

  test("blocks loopback and unique-local IPv6", () => {
    expect(isBlockedV6("::1")).toBe(true);
    expect(isBlockedV6("fc00::1")).toBe(true);
    expect(isBlockedV6("fe80::1")).toBe(true);
    expect(isBlockedV6("::ffff:127.0.0.1")).toBe(true);
    expect(isBlockedV6("2606:4700::1")).toBe(false);
  });
});

describe("assertPublicUrl", () => {
  test("rejects non-http protocols", async () => {
    await expect(assertPublicUrl("file:///etc/passwd")).rejects.toThrow();
    await expect(assertPublicUrl("gopher://a.test")).rejects.toThrow();
  });

  test("rejects literal private addresses", async () => {
    await expect(assertPublicUrl("http://127.0.0.1:3000/api")).rejects.toThrow();
    await expect(assertPublicUrl("http://169.254.169.254/latest/meta-data/")).rejects.toThrow();
  });

  test("allows a non-standard port on a public host", async () => {
    // Regional Indonesian channels commonly serve HLS from Wowza on :1935.
    const parsed = await assertPublicUrl("http://8.8.8.8:1935/live/playlist.m3u8");
    expect(parsed.port).toBe("1935");
  });

  test("rejects malformed input", async () => {
    await expect(assertPublicUrl("not a url")).rejects.toThrow();
  });
});
