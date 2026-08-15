# Contributing

Thanks for helping out. This project exists because people keep it alive when upstream sites change.

## Setup

```bash
bun install
cp .env.example .env
bun run dev
```

Before opening a PR:

```bash
bun run typecheck && bun run lint && bun test
```

## The most common contribution: a broken scraper

Upstream sites change their markup without notice. When an endpoint starts returning empty or
partial data:

1. **Reproduce it as a test first.** Capture the current upstream page into `tests/fixtures/`:
   ```bash
   curl -sL -A "Mozilla/5.0" "https://<upstream>/<page>" -o tests/fixtures/<name>.html
   ```
   For the comic upstream, keep only the Inertia root element — the rest of the page is chrome the
   parser never reads, and full pages bloat the repo.

   **Scrub fixtures before committing.** Upstream payloads can contain credentials that do not
   belong to us — the comic upstream ships its own Google OAuth client id and secret in every
   page's Inertia props. Redact anything matching `*_secret`, `*_token`, `*_key` or
   `client_id` before adding a fixture. GitHub push protection will block the push otherwise,
   and rightly so.

2. **Fix the parser in `src/lib/<domain>/`,** not in the route or the util. Routes stay thin; utils
   only do I/O.

3. **Add an assertion that would have caught it.** A test that only checks "returns an array" will
   not catch the next regression.

Unit tests must never hit the network — that is what keeps CI deterministic and lets you work
offline. Network-touching checks belong in `bun run test:live`.

## Adding a new source adapter

Each domain follows the same three-file shape, so a new source is additive:

1. `src/types/<domain>.ts` — the public response shape.
2. `src/lib/<domain>/` — pure parsers. **No `fetch`, no `process.env`.** Take a base URL as an
   argument if you need one; that is what makes the parser testable.
3. `src/utils/<domain>/` — the I/O layer. Use `fetchHtml` / `fetchJson` from
   `src/lib/shared/http.ts` and pass a `revalidate` value.
4. `src/app/api/v1/<domain>/…/route.ts` — validate params with a schema from
   `src/lib/shared/validate.ts`, then hand off to `apiHandler`.
5. Register the endpoints in `src/lib/openapi.ts` so they appear in `/docs`.
6. Add a fixture and tests.

For a new **embed player**, you only need an entry in `src/lib/movie/providers.ts` plus its host in
`EMBED_HOSTS`. That is one file and one test.

## Conventions

- Run every scraped string through `text()` / `url()` from `src/lib/shared/sanitize.ts`. Upstream
  content is untrusted input.
- Never build error responses by hand — throw a typed error from `src/lib/shared/errors.ts` and let
  `apiHandler` map it.
- Prefer `null` over throwing when an upstream field is missing. Parsers should degrade, not crash.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
  (`fix(comic): …`, `feat(tv): …`).

## Reporting issues

Use the templates. For a broken scraper, include the endpoint, the upstream URL, and what you got
versus what you expected — that is usually enough to write the failing test immediately.
