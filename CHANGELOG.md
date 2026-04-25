# Changelog

All notable changes to this fork of `GravityKit/help-scout-mcp`. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

Hardened private fork of upstream `GravityKit/help-scout-mcp@v2.4.4`. Documents divergence from upstream.

### Security

- **Default-deny on write tools.** `HELPSCOUT_WRITE_INBOX_ALLOWLIST` and `HELPSCOUT_WRITE_DOCS_SITE_ALLOWLIST` must be set explicitly; unset blocks all writes. Previously default-allow.
- **PII redaction in tool-call logs.** Customer emails, reply bodies, search terms, cc/bcc are masked at default `LOG_LEVEL=info`. Previously logged verbatim.
- **HTML sanitization** via `sanitize-html` for `createReply`, `createNote`, `createConversation`, `createDocsArticle`, `updateDocsArticle`. Upstream's `formatReplyHtml` and `collapseBlockWhitespace` only handled whitespace.
- **Help Scout host allowlist.** `HELPSCOUT_BASE_URL` and `HELPSCOUT_DOCS_BASE_URL` validated against an allowlist of known Help Scout endpoints to prevent bearer-token exfiltration to attacker-controlled hosts.
- **Path traversal hardening on `getAttachment`.** `filename` validated against an allowlist; `conversationId` zod-constrained to `^[A-Za-z0-9_-]+$`; resolved path verified to stay inside the intended directory; file modes `0700`/`0600`.
- **API error redaction.** Upstream Help Scout error bodies no longer flow to the LLM verbatim — only `code` and a 200-char `message` are propagated. Prevents customer PII echoed in 422 responses from leaking.
- **Cache prefix isolation.** `cache.clear(prefix)` actually filters by prefix instead of nuking every entry.
- **CSPRNG for request IDs.** `crypto.randomBytes(8)` instead of `Math.random().toString(36).substring(7)`.
- **OAuth token lifecycle.** Bearer token zeroed on `closePool()`. New `LOG_TOKEN_ROTATIONS=true` toggle logs only timestamp + `expires_in`, never the token.
- **Query/secret length validation.** `searchConversations.query` capped at 1024 chars. `HELPSCOUT_APP_SECRET` minimum 24 chars validated at startup.
- **Debug log scrubbing.** Query strings stripped from debug-level URL logs. `responsePreview` removed from Reports API debug logs. Cache log prefixes use stable shapes (`'GET:/conversations/:id/threads'`) instead of leaking IDs.
- **`axios` bumped to `^1.15.2`** to fix two SSRF advisories (GHSA-3p68-rc4w-qgx5, GHSA-fvcv-3m26-pcqx).

### Removed

- **`.claude/settings.local.json`** scrubbed from working tree, all branches, and 13 release tags via `git filter-repo`. Force-pushed to origin. The credentials it contained (`qCJgfjX8a34wTWgn7yWYHUBP6TGHcGFa` / `yS291jdveSs7dUrfqRnRUqSZyVLRjTcV`) were already revoked by Help Scout, but the file is no longer reachable via this fork's history.
- **`dist/`** removed from version control. Now built locally and via `prepublishOnly`. Was committed in upstream causing source/build drift confusion.
- **`claude-desktop-config.json`** removed from repo (the example footgun pattern). Example moved into README as a code block.

### Changed

- **Package metadata.** Renamed `@gravitykit/help-scout-mcp` → `@jgalea/help-scout-mcp`. Set `"private": true` to block accidental npm publishing. Author updated; `contributors[]` preserves attribution to Drew Burchfield (original) and Zack Katz (GravityKit maintainer). Repository / homepage / bugs URLs point to the fork.
- **README** rewritten with security-first framing: Keychain-based credential pattern, full env var reference (including new defaults), and explicit attribution to upstream.
- **`HELPSCOUT_HIDE_INBOX_NAMES`** new env var to emit inbox IDs only (not names) in MCP server `instructions`. Useful when inbox names are sensitive and might leak via shared transcripts.

### Added

- **`SECURITY.md`** with disclosure contact (security@jeangalea.com), scope, posture summary, operator recommendations.
- **`.gitignore` rules** for `.claude/`, `.cursor/`, `GEMINI.md`, `AGENTS.local.md`, `claude-desktop-config.json`, `dist/`, `helpscout-mcp-extension/build/`, `SECURITY-AUDIT.md`.
- **Pre-commit hook** (`scripts/pre-commit-secret-scan.sh`) detecting Help Scout creds, AWS keys, GitHub PATs, Slack tokens, JWTs, Stripe live keys, and AI-tooling files. Install via `npm run install-hooks`.
- **GitHub Actions CI** (`.github/workflows/ci.yml`): test matrix (Node 18/20/22), `npm audit --omit=dev --audit-level=moderate`, secret scan over the full tracked tree.
- **Dependabot** (`.github/dependabot.yml`): weekly npm + actions updates with security-patch grouping.
- **CLAUDE.md** documenting non-negotiables and contribution conventions for future Claude Code sessions on this repo.
- **`docs/runbooks/credential-rotation.md`** for incident response.

## Upstream baseline

This fork started from `GravityKit/help-scout-mcp` at tag `v2.4.4` (2026-03-26). The original work — tool surface, OAuth2 client, cache, Reports API integration, MCPB extension packaging — is by Drew Burchfield and Zack Katz; this fork only adds security hardening and process improvements.

For the upstream changelog (release-notes-style), see https://github.com/GravityKit/help-scout-mcp/releases.
