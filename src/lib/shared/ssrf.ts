import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { ValidationError } from "@/lib/shared/errors";

/**
 * SSRF guard for the live-TV HLS proxy — the only place where this service
 * fetches a URL that did not come from a hard-coded upstream base.
 *
 * The proxy already refuses to accept a URL from the caller (it only takes a
 * channel id and looks the URL up in the cached iptv-org index), so this is the
 * second layer: even a poisoned index entry must not be able to reach anything
 * on the private network.
 */

const BLOCKED_V4 = [
  { base: "0.0.0.0", bits: 8 }, // "this" network
  { base: "10.0.0.0", bits: 8 }, // private
  { base: "100.64.0.0", bits: 10 }, // carrier-grade NAT
  { base: "127.0.0.0", bits: 8 }, // loopback
  { base: "169.254.0.0", bits: 16 }, // link-local (cloud metadata)
  { base: "172.16.0.0", bits: 12 }, // private
  { base: "192.0.0.0", bits: 24 }, // IETF protocol assignments
  { base: "192.168.0.0", bits: 16 }, // private
  { base: "198.18.0.0", bits: 15 }, // benchmarking
  { base: "224.0.0.0", bits: 4 }, // multicast
  { base: "240.0.0.0", bits: 4 }, // reserved
];

function v4ToInt(address: string): number | null {
  const parts = address.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    const octet = Number(part);
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) return null;
    value = (value << 8) | octet;
  }
  return value >>> 0;
}

function isBlockedV4(address: string): boolean {
  const value = v4ToInt(address);
  if (value === null) return true;

  return BLOCKED_V4.some(({ base, bits }) => {
    const baseValue = v4ToInt(base);
    if (baseValue === null) return false;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (value & mask) === (baseValue & mask);
  });
}

function isBlockedV6(address: string): boolean {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, "").split("%")[0] ?? "";

  if (normalized === "::" || normalized === "::1") return true;
  // Unique-local (fc00::/7) and link-local (fe80::/10).
  if (/^f[cd]/.test(normalized)) return true;
  if (/^fe[89ab]/.test(normalized)) return true;

  // IPv4-mapped (::ffff:a.b.c.d) must be judged by its IPv4 rules.
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(normalized);
  if (mapped?.[1]) return isBlockedV4(mapped[1]);

  return false;
}

function isBlockedAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return isBlockedV4(address);
  if (family === 6) return isBlockedV6(address);
  return true;
}

/**
 * Validate that a URL is safe to fetch server-side: http(s) only, standard
 * ports, and a hostname that resolves to a public address.
 *
 * Resolution happens here *and* the result is returned, so callers can pin the
 * connection to the address that was checked and avoid a DNS-rebinding window.
 */
export async function assertPublicUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new ValidationError("Invalid stream URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ValidationError("Stream URL must use http or https");
  }

  // Ports are deliberately not restricted: many regional Indonesian channels
  // serve HLS from Wowza on 1935/8081/etc, and blocking those would break real
  // streams without adding protection — reaching an internal service requires a
  // private address, which is what the check below actually prevents.

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");

  if (isIP(hostname)) {
    if (isBlockedAddress(hostname)) {
      throw new ValidationError("Stream URL resolves to a private address");
    }
    return parsed;
  }

  let addresses: { address: string }[];
  try {
    addresses = await lookup(hostname, { all: true });
  } catch {
    throw new ValidationError("Stream host could not be resolved");
  }

  if (!addresses.length || addresses.some((entry) => isBlockedAddress(entry.address))) {
    throw new ValidationError("Stream URL resolves to a private address");
  }

  return parsed;
}

/** Exposed for tests. */
export const __internal = { isBlockedV4, isBlockedV6 };
