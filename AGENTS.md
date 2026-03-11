# Agent Notes

## Overview

- This repo is a Help Scout MCP server written in TypeScript.
- Build output goes to `dist/`.
- Primary entrypoint is `src/index.ts`.

## Current Tool Surface

- Do not reintroduce `listAllInboxes` as a listed tool. It is a legacy alias only.
- Conversation tools should expose `searchInboxes`, `searchConversations`, `getConversationSummary`, `getThreads`, `getAttachment`, `getServerTime`, `structuredConversationFilter`, `createReply`, `createNote`, `getConversation`, `createConversation`, and `updateConversation`.
- Docs tools use merged entrypoints:
  - `listDocsArticles`
  - `getDocsEntity`
  - `updateDocsEntity`
- Reports use merged entrypoint `getReport`.
- Legacy Docs and Reports names may still be accepted as aliases in dispatch, but they should not appear in `listTools()`.

## Testing Expectations

- Run `npm run build` after code changes.
- Run `npm test` before finishing substantial changes.
- If you change Docs tool routing or schemas, also run:
  - `npm test -- --runInBand src/__tests__/docs-tools.test.ts`
- If you change tool registration or compatibility behavior, also run:
  - `npm test -- --runInBand src/__tests__/tools.test.ts`

## Compatibility Rules

- Preserve legacy alias behavior in `ToolHandler.callTool()` when changing merged Docs or Reports tools.
- Keep `searchInboxes` callable with an empty `query` to list all inboxes.
- Keep `verbose` support as an environment-driven behavior; do not add a `verbose` tool parameter back into schemas unless intentionally reversing the current design.
- Do not add `apiGuidance` back into tool responses unless intentionally reversing the current design.

## Files To Update When Tool Surface Changes

- `src/tools/index.ts`
- `src/tools/docs-tools.ts`
- `src/tools/reports-tools.ts`
- `src/schema/types.ts`
- `src/index.ts`
- `src/prompts/index.ts`
- `mcp.json`
- `helpscout-mcp-extension/manifest.json`
- `README.md`
- `src/__tests__/tools.test.ts`
- `src/__tests__/docs-tools.test.ts`
