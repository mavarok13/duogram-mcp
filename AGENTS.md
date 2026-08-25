# Duogram Agent Guidance

## Required Context

Read the guidance set before making architectural or product changes:

- `AGENTS.md`: engineering rules and agent workflow.
- `docs/INFO.md`: product scope, terminology, and accepted decisions.
- `docs/ROADMAP.md`: ordered implementation stages and current status.
- `docs/CHANGELOG.md`: completed changes that must not be mistaken for plans.

Keep these files consistent. Put stable facts in `INFO.md`, future work in
`ROADMAP.md`, and completed notable work in `CHANGELOG.md`.

## Product

Duogram is a local-first visual board system. Agents use an MCP server to read
and edit boards, while users edit the same boards in a desktop application.

The product hierarchy is:

```text
project -> spaces -> boards -> elements
```

MVP elements are shapes, standalone text, lines, and arrows. Board JSON files
are the source of truth. Persistent board history is out of scope; undo and
redo exist only for the current desktop session.

## Planned Repository Layout

- `apps/desktop`: Electron main process, preload API, and React renderer.
- `packages/core`: schemas, validation, board operations, and file storage.
- `packages/mcp`: universal stdio MCP server and the `duogram` CLI.
- `.duogram`: generated project data; do not introduce it as application
  configuration for this repository.
- `.opencode`: checked-in OpenCode development integration; templates for
  initialized user projects will be implemented with the CLI.

Do not create package boundaries until implementation requires them. Keep
shared domain rules in `packages/core` once the monorepo is scaffolded.

## Engineering Rules

- Use TypeScript with strict type checking.
- Prefer the smallest complete change over speculative abstractions.
- Validate all data at filesystem and MCP boundaries.
- Treat published JSON schemas as versioned APIs and provide migrations for
  incompatible persisted-format changes.
- Use atomic file replacement and revision checks for board writes.
- Keep filesystem access out of the Electron renderer; expose a narrow,
  typed preload API.
- Use cross-platform path and process APIs. Do not assume POSIX paths or shell
  behavior.
- Preserve unknown `agent_meta` values when reading and writing elements.
- Add tests for domain behavior, validation, concurrency, and bug fixes.
- Never commit credentials, local environment files, generated packages, or
  vector database contents.
- Update `README.md` when setup steps or supported commands change.

## Repository Retrieval

Use the installed `codebase-index` CLI before broad repository scans when
locating implementations, explaining flows, or assessing change impact.

- Run `codebase-index update` before querying after substantial edits.
- Use `search`, `explain`, `symbol`, `refs`, or `impact` according to intent.
- Read only the recommended file ranges, then verify behavior in source.
- Fall back to Glob and Grep when index confidence is low or results are empty.
- The local index under `.claude/cache/codebase-index/` is derived and ignored.
- Keep the checked-in OpenCode integration synchronized with
  `codebase-index skill-update`; do not hand-edit generated skill resources.
- Qdrant is not required for repository retrieval. Reconsider a vector service
  only if a later product feature needs shared or large-scale semantic search.

## Current Commands

```bash
pnpm install
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm check
codebase-index index
codebase-index update
codebase-index stats
codebase-index doctor --strict
```
