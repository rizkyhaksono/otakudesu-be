import { describe, expect, test } from "bun:test";
import { decodeEntities, num, stripHtml, text, url } from "@/lib/shared/sanitize";

describe("stripHtml", () => {
  test("removes markup shipped inside upstream text fields", () => {
    expect(stripHtml("<p>Halo <b>dunia</b></p>")).toBe("Halo dunia");
  });

  test("drops script and style bodies entirely", () => {
    expect(stripHtml("a<script>alert(1)</script>b")).toBe("a b");
    expect(stripHtml("<style>.x{color:red}</style>ok")).toBe("ok");
  });

  test("neutralises an injected image handler", () => {
    expect(stripHtml('<img src=x onerror="alert(1)">caption')).toBe("caption");
  });

  test("keeps paragraph breaks readable", () => {
    expect(stripHtml("<p>satu</p><p>dua</p>")).toBe("satu\ndua");
  });

  test("returns empty string for non-strings", () => {
    expect(stripHtml(null)).toBe("");
    expect(stripHtml(undefined)).toBe("");
    expect(stripHtml(42)).toBe("");
  });
});

describe("decodeEntities", () => {
  test("decodes named, decimal and hex entities", () => {
    expect(decodeEntities("&amp;&lt;&gt;")).toBe("&<>");
    expect(decodeEntities("&#65;&#x42;")).toBe("AB");
  });

  test("leaves unknown entities untouched", () => {
    expect(decodeEntities("&notreal;")).toBe("&notreal;");
  });
});

describe("url", () => {
  test("accepts http and https", () => {
    expect(url("https://a.test/x.png")).toBe("https://a.test/x.png");
  });

  test("upgrades protocol-relative URLs", () => {
    expect(url("//a.test/x.png")).toBe("https://a.test/x.png");
  });

  test("rejects javascript: and data: payloads", () => {
    expect(url("javascript:alert(1)")).toBeNull();
    expect(url("data:text/html;base64,PHNjcmlwdD4=")).toBeNull();
  });
});

describe("num", () => {
  test("parses numeric strings and rejects junk", () => {
    expect(num("7.69")).toBe(7.69);
    expect(num(12)).toBe(12);
    expect(num("abc")).toBeNull();
    expect(num(null)).toBeNull();
  });
});

describe("text", () => {
  test("returns null rather than an empty string", () => {
    expect(text("   ")).toBeNull();
    expect(text("<p> </p>")).toBeNull();
    expect(text(" hi ")).toBe("hi");
  });
});
