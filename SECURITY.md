# Security Policy

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately through
[GitHub Security Advisories](https://github.com/rizkyhaksono/otakudesu-be/security/advisories/new),
or email the maintainer listed on the GitHub profile.

Include: what you found, how to reproduce it, and what an attacker could do with it. You will get an
acknowledgement within 72 hours and an assessment within a week.

## Scope

This is a read-only public API with no user accounts, no database and no secrets beyond upstream API
tokens. The areas most worth your attention:

| Area | Where | What is already in place |
| --- | --- | --- |
| **SSRF** | `src/app/api/v1/tv/channels/[id]/stream` | Callers cannot supply a URL. Manifest-derived URLs are HMAC-signed by the server; `assertPublicUrl` re-resolves the host and rejects private ranges, loopback, link-local and cloud metadata addresses. |
| **XSS via upstream content** | `src/lib/shared/sanitize.ts` | All scraped text is tag-stripped at the mapper boundary. `url()` rejects `javascript:` and `data:`. |
| **Path traversal** | `assertSlug`, `src/lib/shared/validate.ts` | Slugs are pattern-matched; `..` and `/` are rejected before any upstream request. |
| **Abuse / amplification** | `src/proxy.ts` | Per-IP token bucket. Every request fans out to a third party, so this also protects the upstreams. |
| **Header/response injection** | `src/lib/shared/apiHandler.ts` | Responses are JSON-encoded; upstream error text is never echoed verbatim. |

### Known, accepted design decisions

- **CORS is `*`.** Intentional: this is a public community API. It is read-only, `GET`-only, sends
  no credentials, and is rate limited.
- **The HLS signing key is per-process** unless `HLS_PROXY_SECRET` is set. Manifests are short-lived,
  so this is fine for a single instance; set the variable when running replicas.
- **Third-party embed providers** are outside our control. They are iframe-sandboxed by consumers
  and configurable via `MOVIE_EMBED_PROVIDERS`.

## Supported versions

The `main` branch is supported. Fixes land there and are released from there.
