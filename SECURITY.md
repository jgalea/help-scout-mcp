# Security Policy

## Reporting a Vulnerability

If you find a security issue in this fork, please email **security@jeangalea.com** with:

- A clear description of the vulnerability
- Steps to reproduce, or a proof-of-concept
- The version (commit SHA) you tested against
- Whether you've contacted the upstream `GravityKit/help-scout-mcp` about the same issue

Do **not** open public GitHub issues for security reports. Report privately first; coordinated disclosure is appreciated.

You can expect:

- An acknowledgement within 3 business days
- A triage assessment within 7 business days
- A fix or mitigation timeline once severity is confirmed

## Scope

This fork is hardened for production use connecting to RebelCode's Help Scout. Findings in any of the following are in scope:

- Authentication / OAuth2 token handling (`src/utils/helpscout-client.ts`, `src/utils/helpscout-docs-client.ts`)
- Input validation on MCP tool arguments (`src/schema/types.ts`, `src/tools/`)
- HTML sanitization for replies, notes, and Docs articles (`src/utils/html-sanitize.ts`)
- Path traversal in file-writing tools (e.g. `getAttachment`)
- PII redaction in logs (`src/utils/logger.ts`)
- Hostname allowlist for Help Scout API endpoints (`src/utils/config.ts`)
- Write-tool authorization (`HELPSCOUT_WRITE_INBOX_ALLOWLIST`, `HELPSCOUT_WRITE_DOCS_SITE_ALLOWLIST`)
- Cache key isolation (`src/utils/cache.ts`)
- Dependency vulnerabilities (`package.json`)

Out of scope (report directly to upstream maintainer instead):

- Issues in `GravityKit/help-scout-mcp` versions before this fork
- Issues in Help Scout's own product (report to Help Scout)
- Issues in Anthropic's MCP SDK (`@modelcontextprotocol/sdk`)

## Security Posture

This fork was forked from `GravityKit/help-scout-mcp@v2.4.4` and hardened against the findings in a private security audit dated 2026-04-25. Headline changes from upstream:

- **Default-deny on write tools.** `HELPSCOUT_WRITE_INBOX_ALLOWLIST` and `HELPSCOUT_WRITE_DOCS_SITE_ALLOWLIST` must be set explicitly; unset means writes are blocked.
- **Real HTML sanitization** via `sanitize-html` for replies, notes, conversations, and Docs articles. Upstream had only whitespace normalization.
- **PII-redacted logs.** Tool-call arguments are redacted at default `LOG_LEVEL=info`. Customer emails, reply bodies, and search terms are masked.
- **Help Scout host allowlist.** `HELPSCOUT_BASE_URL` and `HELPSCOUT_DOCS_BASE_URL` are validated against an allowlist of known Help Scout endpoints; other hosts are rejected to prevent token exfiltration.
- **Path traversal hardening.** `getAttachment` validates `filename` and `conversationId`, restricts file modes to `0600`, and verifies resolved paths stay inside the intended directory.
- **API error redaction.** Upstream errors are no longer surfaced to the LLM verbatim; only `code` and a truncated `message` are propagated.
- **CSPRNG for request IDs.** `crypto.randomBytes` instead of `Math.random()`.
- **Token lifecycle.** OAuth bearer token is zeroed on `closePool()`. `LOG_TOKEN_ROTATIONS=true` logs only timestamp + expires_in.
- **Cache prefix isolation.** `cache.clear(prefix)` actually filters by prefix instead of nuking everything.
- **Dependency hygiene.** `axios` bumped to `^1.15.2` to fix two SSRF advisories.
- **No credentials in repo.** `.claude/`, `dist/`, `.env*`, `claude-desktop-config.json` are gitignored. The leaked credentials from upstream's `.claude/settings.local.json` were removed and history was rewritten on this fork.

## Operator Recommendations

When deploying this MCP:

- Store `HELPSCOUT_APP_ID` and `HELPSCOUT_APP_SECRET` in a secret manager (macOS Keychain, Doppler, 1Password CLI, AWS Secrets Manager). Do not put them in `.env` files committed to source control or in `.claude/settings.local.json`.
- Set `HELPSCOUT_WRITE_INBOX_ALLOWLIST` to the specific mailbox IDs the agent is allowed to reply on. An empty/unset value blocks all writes.
- Set `HELPSCOUT_WRITE_DOCS_SITE_ALLOWLIST` similarly for Docs sites.
- Keep `HELPSCOUT_ALLOW_SEND_REPLY=false` (the default — drafts only) until you've validated the agent's tone and accuracy. Flip to `true` only after manual review.
- Do not set `LOG_LEVEL=debug` in any environment that ships logs off-host. Customer ticket IDs and query strings end up in stderr at debug level.
- Run `npm audit` regularly. Add `npm audit --omit=dev --audit-level=moderate` to CI.

## Upstream

This fork tracks `GravityKit/help-scout-mcp` as `upstream`. Security-relevant fixes from upstream are reviewed and cherry-picked when applicable. Non-security divergence is intentional — this fork is maintained independently.
