# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
The project does not have a released version yet.

## Unreleased

### Added

- Prepared version 0.1.0 package metadata, native desktop packaging, and a
  three-platform release workflow for npm and GitHub publication.
- Added isolated tarball installation, CLI initialization, and MCP handshake
  smoke checks, plus distribution and signing documentation.
- Built the unsigned Windows x64 NSIS installer and verified isolated npm
  package installation for the 0.1.0 release preparation. Publication and
  macOS/Linux build execution remain pending.

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
- Added the Electron desktop application with a sandboxed preload bridge and
  React renderer.
- Added project opening, space and board navigation, and an SVG board canvas
  for shapes, standalone text, lines, arrows, and attached connector endpoints.
- Added element dragging, geometry and style inspection, session undo and redo,
  and revision-checked autosave.
- Added filesystem watching with clean-board reloads, validation feedback, and
  explicit conflict resolution for concurrent agent and desktop edits.
- Added desktop tests for session history, error mapping, project writes, and
  external board change notifications.
- Configured relative renderer asset paths so Electron can load the production
  Vite bundle through `file://` URLs.
- Kept browser-side board operations free of the Node storage and Ajv runtime,
  preventing CSP `unsafe-eval` failures in the Electron renderer.
- Fixed SVG text hit testing so standalone text can be selected and dragged.
- Added additive multi-selection with Shift/Ctrl/Cmd, group dragging, left
  mouse-button panning on the empty canvas, and center-anchored wheel zoom.
- Added shape border editing for visibility, style, thickness, and color.
- Added bundled Roboto, Montserrat, Open Sans, and Source Sans 3 font choices
  under SIL Open Font License 1.1, plus persisted `font_family` styling.
- Fixed text selection and movement by restoring pointer events on SVG text.
- Added additive multi-selection, group dragging, left-button canvas panning,
  and center-anchored mouse-wheel zoom.
- Added shape border editing and bundled Roboto, Montserrat, Open Sans, and
  Source Sans 3 font choices under SIL Open Font License 1.1.
- Added persisted `font_family` styling with a Roboto default for legacy boards.
- Added mouse resize handles for shapes and standalone text with minimum sizes.
- Added automatic word wrapping and clipping for text inside element blocks.
- Added desktop controls for creating, renaming, deleting, reordering, and
  moving boards between spaces, including revision-checked project writes.
- Added desktop `agent_meta` JSON editing and a constrained, scrollable
  inspector layout.
- Fixed responsive canvas grid bounds during zoom so the grid remains aligned
  with the current viewport.

### Fixed

- Replaced native deletion confirmations with an in-app dialog to avoid
  Electron keyboard-focus loss after deleting boards or spaces.
- Replaced desktop project, space, and board lifecycle prompts with inline name
  fields that commit on Enter or clicking elsewhere in the application.
- Fixed space inline editing styles and added revision-checked desktop space
  deletion for empty spaces.
- Fixed italic text rendering and limited inspector textarea resizing to the
  vertical direction.

### Removed

- Removed Qdrant and Docker Compose from the development environment in favor
  of the installed local `codebase-index` retrieval layer.
