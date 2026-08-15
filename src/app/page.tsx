import Link from "next/link";
import { operations } from "@/lib/openapi";

const DOMAINS = [
  { tag: "Anime", note: "Ongoing, completed, episodes, batches and schedule" },
  { tag: "Comic", note: "Listings, detail and the full chapter reader payload" },
  { tag: "Movie", note: "TMDB metadata plus embed player sources" },
  { tag: "Live TV", note: "Indonesian channels with a CORS-safe HLS proxy" },
] as const;

export default function Home() {
  const counts = new Map<string, number>();
  for (const operation of operations()) {
    counts.set(operation.tag, (counts.get(operation.tag) ?? 0) + 1);
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "4rem 1.5rem" }}>
      <p style={label}>Open source · MIT</p>
      <h1 style={{ fontSize: "2.5rem", lineHeight: 1.1, margin: "0.5rem 0 1rem" }}>
        Otakudesu Community API
      </h1>
      <p style={{ color: "var(--muted)", margin: "0 0 2.5rem", fontSize: "1.05rem" }}>
        A read-only public API for anime, comics, movies and Indonesian live TV. Built by the
        community, for the community.
      </p>

      <div style={{ border: "1px solid var(--line)", marginBottom: "2.5rem" }}>
        {DOMAINS.map((domain, index) => (
          <div
            key={domain.tag}
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "baseline",
              padding: "0.9rem 1rem",
              borderTop: index === 0 ? "none" : "1px solid var(--line)",
            }}
          >
            <strong style={{ minWidth: "5.5rem" }}>{domain.tag}</strong>
            <span style={{ color: "var(--muted)", flex: 1 }}>{domain.note}</span>
            <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
              {counts.get(domain.tag) ?? 0}
            </span>
          </div>
        ))}
      </div>

      <p style={{ marginBottom: "2.5rem" }}>
        <Link href="/docs" style={{ color: "var(--accent)", fontWeight: 600 }}>
          Browse the API reference →
        </Link>
      </p>

      <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
        This project indexes and links to third-party sources. It hosts no media of its own.{" "}
        <a href="https://github.com/rizkyhaksono/otakudesu-be">Source on GitHub</a>.
      </p>
    </main>
  );
}

const label = {
  margin: 0,
  fontSize: "0.75rem",
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  color: "var(--muted)",
};
