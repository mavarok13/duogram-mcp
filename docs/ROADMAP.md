# Roadmap

The roadmap records planned work, not shipped capability. Completed notable
changes belong in `CHANGELOG.md`.

## 0. Repository Foundation

- [x] Initialize a local Git repository.
- [x] Add `.gitignore` and cross-platform line-ending rules.
- [x] Add the repository guidance set.
- [x] Configure local repository retrieval with `codebase-index`.

## 1. TypeScript Workspace

- [x] Create the pnpm workspace and strict shared TypeScript configuration.
- [x] Add build, lint, type-check, and test commands.
- [x] Defer desktop, core, and MCP package directories until their application
      code is introduced.
- [x] Add CI for Windows, macOS, and Linux.

## 2. Core Domain and Storage

- [x] Define versioned project, space, board, and element schemas.
- [x] Model shapes, text, lines, arrows, and connector attachments.
- [x] Implement boundary validation and schema migration infrastructure.
- [x] Implement atomic writes and optimistic revision checks.
- [x] Test validation, operations, concurrency, and unknown `agent_meta` fields.

## 3. CLI and MCP Server

- [x] Implement project initialization for `.duogram` and `.opencode`.
- [x] Implement space and board lifecycle operations.
- [x] Implement board reads and atomic batches of element operations.
- [x] Expose the operations through a universal stdio MCP server.
- [x] Add MCP protocol and integration tests.

## 4. Desktop Application

- [ ] Create the Electron main process, preload API, and React renderer.
- [ ] Add project opening and space/board navigation.
- [ ] Add the visual canvas and MVP element editing.
- [ ] Add in-session undo and redo.
- [ ] Add autosave, filesystem watching, validation errors, and conflict UI.

## 5. Distribution

- [ ] Build desktop artifacts for Windows, macOS, and Linux.
- [ ] Publish the npm CLI and MCP package.
- [ ] Add clean-machine installation and end-to-end smoke tests.
- [ ] Document signing and notarization requirements separately from unsigned
      development builds.
