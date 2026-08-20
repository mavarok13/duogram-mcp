# Project Information

## Purpose

Duogram is a local-first visual board system. An agent reads and edits boards
through a universal stdio MCP server. A user opens the same project in a
cross-platform desktop application and can inspect or adjust the result.

A typical workflow is an agent drawing an application architecture and a user
correcting a connection between its blocks.

## Product Model

The hierarchy is:

```text
project -> spaces -> boards -> elements
```

- A project is represented by a directory initialized for Duogram.
- A project contains named spaces.
- A space contains one or more boards.
- Each board is stored as JSON and is the source of truth.
- MVP elements are shapes with text, standalone text, lines, and arrows.
- Element data includes an ID, position, size, content, color, and open-ended
  `agent_meta` values.
- Lines and arrows are separate connector elements. Optional source and target
  attachments refer to element IDs and anchors; unattached endpoints remain
  valid for free-form connectors.

Persistent board history is out of scope. Undo and redo only cover the current
desktop session.

## Planned Architecture

The implementation will use a strict TypeScript monorepo when application code
is introduced:

```text
apps/desktop   Electron main process, typed preload API, and React renderer
packages/core  Schemas, validation, board operations, and file storage
packages/mcp   Universal stdio MCP server and the duogram CLI
```

The renderer must not access the filesystem directly. Board writes use schema
validation, revision checks, and atomic file replacement. The desktop watches
project files and reloads clean boards when an agent changes them externally.

## Initialized Projects

The Duogram initializer will create:

- `.duogram` for project, space, and board data.
- `.opencode` for generated OpenCode agents, skills, and MCP integration.

Generated board data and agent metadata must survive read-modify-write cycles
without losing unknown fields.

## Delivery Targets

- Windows, macOS, and Linux desktop applications.
- Installable desktop artifacts.
- A published npm CLI and MCP package.
- A universal MCP interface with OpenCode integration provided as a template.

## Development Retrieval

This repository uses `codebase-index` for local code retrieval. It stores a
derived SQLite index in `.claude/cache/codebase-index/` and does not require a
vector database or Docker. Embeddings are disabled by default; FTS5, symbols,
and dependency graphs provide the initial retrieval path.

This development index is separate from any future semantic search feature in
the Duogram product. A product-level vector store should be selected only when
its data volume, embedding model, and deployment requirements are known.
