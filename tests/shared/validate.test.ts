import { describe, expect, test } from "bun:test";
import { ValidationError } from "@/lib/shared/errors";
import { assertSlug } from "@/lib/shared/env";
import { chapterNumberSchema, pageSchema, parse, slugSchema } from "@/lib/shared/validate";

describe("assertSlug", () => {
  test("rejects traversal and separators", () => {
    for (const value of ["..", "../etc", "a/b", "", "  ", "-leading"]) {
      expect(() => assertSlug(value)).toThrow(ValidationError);
    }
  });

  test("accepts ordinary slugs", () => {
    expect(assertSlug("slime-s4-sub-indo")).toBe("slime-s4-sub-indo");
    expect(assertSlug("one_piece2")).toBe("one_piece2");
  });
});

describe("param schemas", () => {
  test("page must be a positive integer", () => {
    expect(parse(pageSchema, "3", "page")).toBe(3);
    expect(() => parse(pageSchema, "-1", "page")).toThrow(ValidationError);
    expect(() => parse(pageSchema, "abc", "page")).toThrow(ValidationError);
  });

  test("chapter numbers may be fractional but not negative", () => {
    expect(parse(chapterNumberSchema, "43", "chapter")).toBe(43);
    expect(parse(chapterNumberSchema, "43.5", "chapter")).toBe(43.5);
    expect(() => parse(chapterNumberSchema, "-1", "chapter")).toThrow(ValidationError);
  });

  test("slug schema mirrors assertSlug", () => {
    expect(() => parse(slugSchema, "../x", "slug")).toThrow(ValidationError);
  });
});
