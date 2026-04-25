# Help Scout MCP Server (hardened fork)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://typescriptlang.org/)

An MCP server that exposes [Help Scout](https://www.helpscout.com/) to AI assistants — search conversations, fetch transcripts, manage Docs articles, pull reports.

This is a **security-hardened private fork** of [`GravityKit/help-scout-mcp`](https://github.com/GravityKit/help-scout-mcp) (which itself forks [`drewburchfield/help-scout-mcp-server`](https://github.com/drewburchfield/help-scout-mcp-server)). The original maintainers wrote the bulk of the code; this fork applies fixes for a private security audit dated 2026-04-25 and switches several defaults to fail-closed.

Headline differences from upstream are listed in [SECURITY.md](./SECURITY.md). If you want the original, use `@gravitykit/help-scout-mcp` from npm.

## Quick start

### Prerequisites

- Node.js 18+
- A Help Scout account and a [Custom App](https://secure.helpscout.net/users/profile/apps) with **Read** scope on Mailbox + Customers + Reports (and write scopes only if you intend to use write tools)
- macOS Keychain or another secret manager (recommended), or env vars (acceptable for local development)

### Install (Claude Code)

```bash
git clone https://github.com/jgalea/help-scout-mcp.git
cd help-scout-mcp
npm install && npm run build
```

Then add to `.mcp.json` in your project:

```json
{
  "mcpServers": {
    "helpscout": {
      "command": "node",
      "args": ["/absolute/path/to/help-scout-mcp/dist/index.js"],
      "env": {
        "HELPSCOUT_APP_ID": "...",
        "HELPSCOUT_APP_SECRET": "...",
        "HELPSCOUT_WRITE_INBOX_ALLOWLIST": "12345,67890"
      }
    }
  }
}
```

> **Default-deny:** if `HELPSCOUT_WRITE_INBOX_ALLOWLIST` is unset, every write tool returns an error. List the mailbox IDs you want the agent to write to.

### Credential storage

The MCP reads credentials from environment variables. Three patterns, listed best to worst:

**1. Keychain via launcher (recommended on macOS)**

```bash
# One-time: store in Keychain
security add-generic-password -s claude-helpscout-app-id -w 'YOUR_APP_ID' -U
security add-generic-password -s claude-helpscout-app-secret -w 'YOUR_APP_SECRET' -U
```

Then create a launcher that reads from Keychain at startup:

```bash
#!/bin/bash
# launcher.sh
export HELPSCOUT_APP_ID="$(security find-generic-password -s claude-helpscout-app-id -w)"
export HELPSCOUT_APP_SECRET="$(security find-generic-password -s claude-helpscout-app-secret -w)"
exec node /absolute/path/to/help-scout-mcp/dist/index.js
```

Reference the launcher in `.mcp.json`:

```json
{
  "mcpServers": {
    "helpscout": {
      "command": "/absolute/path/to/launcher.sh",
      "env": {
        "HELPSCOUT_WRITE_INBOX_ALLOWLIST": "12345,67890"
      }
    }
  }
}
```

The MCP binary never sees a credential string in `args` or `argv`, and `.mcp.json` (which can be committed to a repo) holds no secrets.

**2. Secret manager (Doppler / 1Password CLI / AWS Secrets Manager)**

Use the same launcher pattern, replacing `security find-generic-password` with your secret manager's CLI.

**3. Plain env vars or `.env` files**

Acceptable for local development. **Do not** put credentials in:

- `.claude/settings.local.json` (this is exactly how upstream's credentials leaked publicly)
- Anything committed to git
- Anything shipped to a remote log aggregator

## Tools

### Conversations

| Tool | Description |
|------|-------------|
| `searchConversations` | Search by keywords, structured filters, status, date, inbox. Supports `includeTranscripts` for inline message content. |
| `structuredConversationFilter` | Lookup by ticket number, assignee, customer ID, folder. |
| `getConversationSummary` | First customer message + latest staff reply. |
| `getThreads` | Full message history (excludes drafts by default). |
| `getAttachment` | Download an attachment to a temp file (mode 0600). |
| `searchInboxes` | List inboxes by name (or all). |
| `createReply` | Write — drafts by default. Set `HELPSCOUT_ALLOW_SEND_REPLY=true` to allow published. Subject to `HELPSCOUT_WRITE_INBOX_ALLOWLIST`. |
| `createNote` | Internal note. Subject to write allowlist. |
| `getConversation` | Direct conversation lookup with optional embedded threads. |
| `createConversation` | Open a new ticket. Subject to write allowlist. |
| `updateConversation` | Change status / assignee / tags / subject. Subject to write allowlist. |
| `getServerTime` | Current Help Scout server timestamp. |

### Docs

Set `HELPSCOUT_DISABLE_DOCS=true` to hide all Docs tools.

| Tool | Description |
|------|-------------|
| `listDocsSites` | Browse all docs sites. |
| `listDocsCollections` / `getSiteCollections` | Navigate collections. |
| `listDocsCategories` / `listDocsArticles` / `searchDocsArticles` | Browse content. |
| `getDocsArticle` / `listRelatedDocsArticles` | Read articles. |
| `createDocsArticle` / `updateDocsArticle` / `uploadDocsArticle` | Write — subject to `HELPSCOUT_WRITE_DOCS_SITE_ALLOWLIST`. |
| `deleteDocsArticle` | Requires `HELPSCOUT_ALLOW_DOCS_DELETE=true`. |
| `createDocsCategory` / `updateDocsEntity` | Manage docs structure. |
| `updateDocsViewCount` | Analytics tracking. |

### Reports

| Tool | Description |
|------|-------------|
| `getReport` | Unified entrypoint for conversation, user, company, happiness, and docs reports. Plus/Pro plan only. |

## Configuration

### Required

| Variable | Description |
|----------|-------------|
| `HELPSCOUT_APP_ID` | OAuth2 App ID from Help Scout → My Apps. Min 24 chars (validated). |
| `HELPSCOUT_APP_SECRET` | OAuth2 App Secret. Min 24 chars (validated). |

### Write-tool authorization (default-deny)

| Variable | Description |
|----------|-------------|
| `HELPSCOUT_WRITE_INBOX_ALLOWLIST` | **Required to enable any write tool.** Comma-separated mailbox IDs the agent may target with `createReply`, `createNote`, `createConversation`, `updateConversation`. Unset = all writes blocked. |
| `HELPSCOUT_WRITE_DOCS_SITE_ALLOWLIST` | **Required to enable any Docs write tool.** Comma-separated Docs site IDs. Unset = all Docs writes blocked. |
| `HELPSCOUT_ALLOW_SEND_REPLY` | Set to `true` to permit published (vs. draft) replies. Default `false`. |
| `HELPSCOUT_ALLOW_DOCS_DELETE` | Set to `true` to permit `deleteDocsArticle`. Default `false`. |

### Optional behavior

| Variable | Description | Default |
|----------|-------------|---------|
| `HELPSCOUT_DEFAULT_INBOX_ID` | Default inbox for searches when none specified. | None |
| `HELPSCOUT_BASE_URL` | Help Scout API endpoint. Validated against allowlist `api.helpscout.net` / `api.helpscout.com`. | `https://api.helpscout.net/v2/` |
| `HELPSCOUT_DOCS_BASE_URL` | Help Scout Docs API endpoint. Validated against `docsapi.helpscout.net`. | `https://docsapi.helpscout.net/v1/` |
| `HELPSCOUT_DOCS_API_KEY` | Separate Docs API key (set up in Help Scout Docs Settings, not the OAuth2 app). Required for Docs tools. | None |
| `HELPSCOUT_DISABLE_DOCS` | Hide all Docs tools from the tool list. | `false` |
| `HELPSCOUT_HIDE_INBOX_NAMES` | Emit inbox IDs only (not names) in MCP server instructions. Useful if your inbox names are sensitive. | `false` |
| `REDACT_MESSAGE_CONTENT` | Hide message bodies in tool responses. | `false` |
| `CACHE_TTL_SECONDS` | Cache TTL for API responses. | `300` |
| `LOG_LEVEL` | `error`, `warn`, `info`, `debug`. **Do not use `debug` in environments that ship logs off-host** — it includes URL paths and IDs. | `info` |
| `LOG_TOKEN_ROTATIONS` | Set to `true` to log timestamp + `expires_in` on each OAuth token rotation. Never logs the token itself. | `false` |

## Security

This fork's security posture is documented in [SECURITY.md](./SECURITY.md). In short:

- HTML sanitization on all reply / note / docs write paths (`sanitize-html`)
- PII redaction in tool-call argument logs at default `LOG_LEVEL=info`
- Default-deny on write-tool authorization (per-mailbox, per-docs-site allowlists)
- Hostname allowlist on Help Scout API endpoints
- Path traversal hardening on `getAttachment`
- Whitelisted upstream API error fields (no verbatim error-body leaks to LLM)
- CSPRNG for request IDs, mode `0600` on attachment files
- Token zeroed on shutdown
- Dependency vulns patched (axios bumped to fix two SSRF advisories)
- `.claude/`, `dist/`, `.env*`, `claude-desktop-config.json` are gitignored

## Development

```bash
git clone https://github.com/jgalea/help-scout-mcp.git
cd help-scout-mcp
npm install
npm run build      # build dist/
npm test           # run all tests
npm run type-check # TypeScript validation
npm run lint       # ESLint
```

The repo ships with a Semgrep config (`.semgrep.yml`) and a security-first Jest fixture set (no real customer data anywhere in `src/__tests__/`). New write tools or API integrations should add tests covering both the authorized and rejected paths.

## Reporting Bugs

- **Security issues**: please follow [SECURITY.md](./SECURITY.md) — do not file public GitHub issues.
- **Functional bugs**: open a GitHub issue.

## License

MIT — see [LICENSE](./LICENSE). Copyright on the original work belongs to the upstream maintainers (Drew Burchfield, GravityKit). Modifications in this fork are © 2026 Jean Galea, also under MIT.
