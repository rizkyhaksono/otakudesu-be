import { describe, expect, test } from "bun:test";
import { parseFeed } from "@/lib/news/rss";
import { fixture } from "../helpers";

const xml = fixture("news-feed.xml");

describe("parseFeed", () => {
  test("reads every item in the feed", () => {
    const items = parseFeed(xml, 500);
    expect(items.length).toBe(106);
  });

  test("respects the limit", () => {
    expect(parseFeed(xml, 5).length).toBe(5);
  });

  test("maps the fields a headline needs", () => {
    const [first] = parseFeed(xml, 1);
    expect(first).toBeDefined();
    expect(first!.title.length).toBeGreaterThan(0);
    expect(first!.link).toStartWith("https://www.animenewsnetwork.com/");
    expect(first!.published_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test("strips markup out of summaries", () => {
    for (const item of parseFeed(xml, 500)) {
      expect(item.summary ?? "").not.toContain("<");
    }
  });

  test("drops an item with no usable link rather than emitting a broken one", () => {
    const broken = "<rss><channel><item><title>No link here</title></item></channel></rss>";
    expect(parseFeed(broken)).toEqual([]);
  });

  test("leaves published_at null when the date is unparseable", () => {
    const odd =
      "<rss><channel><item><title>T</title><link>https://example.com/a</link><pubDate>not a date</pubDate></item></channel></rss>";
    expect(parseFeed(odd)[0]!.published_at).toBeNull();
  });
});
