# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
The project does not have a released version yet.

## Unreleased

### Added

- Initialized the local Git repository with a `main` branch.
- Added repository ignore and cross-platform line-ending rules.
- Added the project guidance set: `AGENTS.md`, `docs/INFO.md`,
  `docs/CHANGELOG.md`, and `docs/ROADMAP.md`.
- Added a local `codebase-index` OpenCode skill, agent, and command integration.
- Added an ignored local SQLite code index for repository retrieval.
- Excluded generated `codebase-index` integration resources from retrieval
  results.
- Added a pnpm workspace with strict shared TypeScript configuration.
- Added formatting, linting, type-checking, testing, and build commands.
- Added a locked dependency graph and an explicit pnpm build-script policy.
- Added CI verification for Windows, macOS, and Linux.
- Documented the accepted versioned JSON storage format for projects, boards,
  elements, connectors, text styles, and shape borders.
- Added the `@duogram/core` package with public v1 project and board schemas,
  strict boundary and domain validation, and sequential migration support.
- Added immutable board element batches with revision checks and connector
  detachment that preserves derived endpoints.
- Added cross-platform project storage with cooperative write locks, optimistic
  concurrency checks, atomic JSON replacement, and manifest-to-board checks.
- Added core tests for validation, operations, migrations, storage concurrency,
  future schema versions, and preservation of open-ended `agent_meta` data.
- Added the `@duogram/mcp` package with the `duogram init` CLI and universal
  stdio MCP server.
- Added safe initialization of default project data and generated OpenCode MCP,
  agent, and skill integration while preserving unrelated configuration.
- Added revision-checked space and board lifecycle operations, board reads, and
  atomic element operation batches through ten MCP tools.
- Added MCP protocol and integration tests using the official SDK transport.

### Removed

- Removed Qdrant and Docker Compose from the development environment in favor
  of the installed local `codebase-index` retrieval layer.
