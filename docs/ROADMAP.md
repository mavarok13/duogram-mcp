# Roadmap

The roadmap records planned work, not shipped capability. Completed notable
changes belong in `CHANGELOG.md`.

## 0. Repository Foundation

- [x] Initialize a local Git repository.
- [x] Add `.gitignore` and cross-platform line-ending rules.
- [x] Add the repository guidance set.
- [x] Configure local repository retrieval with `codebase-index`.

## 1. TypeScript Workspace

- [ ] Create the pnpm workspace and strict shared TypeScript configuration.
- [ ] Add build, lint, type-check, and test commands.
- [ ] Create package boundaries only for desktop, core, and MCP code that
  exists at this stage.
- [ ] Add CI for Windows, macOS, and Linux.

## 2. Core Domain and Storage

- [ ] Define versioned project, space, board, and element schemas.
- [ ] Model shapes, text, lines, arrows, and connector attachments.
- [ ] Implement boundary validation and schema migration infrastructure.
- [ ] Implement atomic writes and optimistic revision checks.
- [ ] Test validation, operations, concurrency, and unknown `agent_meta` fields.

## 3. CLI and MCP Server

- [ ] Implement project initialization for `.duogram` and `.opencode`.
- [ ] Implement space and board lifecycle operations.
- [ ] Implement board reads and atomic batches of element operations.
- [ ] Expose the operations through a universal stdio MCP server.
- [ ] Add MCP protocol and integration tests.

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
