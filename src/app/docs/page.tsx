import Link from "next/link";
import type { Metadata } from "next";
import { operations } from "@/lib/openapi";

export const metadata: Metadata = {
  title: "API Reference — Otakudesu Community API",
  description: "Every endpoint exposed by the anime, comic, movie and live TV API.",
};

const TAG_ORDER = ["Meta", "Anime", "Comic", "Movie", "Live TV"] as const;

/**
 * Rendered on the server with no client JavaScript and no external assets, so
 * it stays fast and works under a strict CSP. The machine-readable spec lives
 * at /api/openapi.json for Postman, Insomnia, Scalar and friends.
 */
export default function Docs() {
  const grouped = new Map<string, ReturnType<typeof operations>>();
  for (const operation of operations()) {
    grouped.set(operation.tag, [...(grouped.get(operation.tag) ?? []), operation]);
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>
      <p style={{ margin: 0 }}>
        <Link href="/" style={{ color: "var(--muted)", textDecoration: "none" }}>
          ← Back
        </Link>
      </p>
      <h1 style={{ fontSize: "2rem", margin: "0.75rem 0 0.5rem" }}>API Reference</h1>
      <p style={{ color: "var(--muted)", marginTop: 0 }}>
        All endpoints are <code>GET</code> and public. Success is always{" "}
        <code>{"{ data }"}</code>, failure always <code>{"{ error }"}</code>. Download the{" "}
        <a href="/api/openapi.json" style={{ color: "var(--accent)" }}>
          OpenAPI 3.1 spec
        </a>
        .
      </p>

      {TAG_ORDER.map((tag) => {
        const list = grouped.get(tag);
        if (!list?.length) return null;

        return (
          <section key={tag} style={{ marginTop: "2.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {tag}
            </h2>
            <div style={{ border: "1px solid var(--line)" }}>
              {list.map((operation, index) => (
                <article
                  key={operation.path}
                  style={{
                    padding: "1rem",
                    borderTop: index === 0 ? "none" : "1px solid var(--line)",
                  }}
                >
                  <code style={{ fontWeight: 600, wordBreak: "break-all" }}>
                    <span style={{ color: "var(--accent)", marginRight: "0.6rem" }}>GET</span>
                    {operation.path}
                  </code>
                  <p style={{ margin: "0.4rem 0 0", color: "var(--muted)" }}>{operation.summary}</p>

                  {operation.params?.length ? (
                    <ul style={{ margin: "0.6rem 0 0", paddingLeft: "1.1rem", fontSize: "0.9rem" }}>
                      {operation.params.map((param) => (
                        <li key={`${param.in}-${param.name}`} style={{ color: "var(--muted)" }}>
                          <code>{param.name}</code>{" "}
                          <em style={{ fontSize: "0.8em" }}>({param.in}</em>
                          {param.required ? <em style={{ fontSize: "0.8em" }}>, required</em> : null}
                          <em style={{ fontSize: "0.8em" }}>)</em> — {param.description}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
