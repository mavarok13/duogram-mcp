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

## Persisted JSON Format

Duogram data uses JSON with `snake_case` field names. The `.duogram` directory
contains one project manifest and one file per board:

```text
.duogram/
├─ project.json
└─ boards/
   └─ <board-id>.json
```

IDs are UUID v4 values. Board filenames use IDs rather than names, so moving a
board between spaces or renaming it does not move its data file. Spaces are
logical groups stored in the project manifest.

Space and board names are display labels and do not need to be unique. IDs
uniquely identify spaces and boards.

### Project Manifest

```json
{
  "schema_version": 1,
  "id": "6251e344-f5d7-4a31-a187-e6af7dd36d42",
  "name": "My project",
  "revision": 3,
  "spaces": [
    {
      "id": "a349a252-c715-4cb3-80d7-5cc037e89d60",
      "name": "Architecture",
      "boards": [
        {
          "id": "ee947ec8-7112-464b-aacc-72f94949988a",
          "name": "Backend"
        }
      ]
    }
  ]
}
```

Each board ID must occur exactly once in the manifest and resolve to
`.duogram/boards/<board-id>.json`. Array order defines the UI order of spaces
and boards.

### Board

```json
{
  "schema_version": 1,
  "id": "ee947ec8-7112-464b-aacc-72f94949988a",
  "revision": 7,
  "elements": []
}
```

Element array order defines z-order. New elements are appended to the top.
Pan, zoom, selection, and undo/redo state are not persisted in board JSON.

### Shape

```json
{
  "id": "ed61da9c-4808-4656-b893-dae123e597fe",
  "type": "shape",
  "shape_kind": "rectangle",
  "position": { "x": 100, "y": 120 },
  "size": { "width": 240, "height": 100 },
  "content": "API server",
  "color": "#3b82f6",
  "border": {
    "style": "solid",
    "thickness": 2,
    "color": "#1d4ed8"
  },
  "text_style": {
    "font_family": "Roboto",
    "horizontal_alignment": "center",
    "vertical_alignment": "center",
    "bold": true,
    "italic": false,
    "underline": false,
    "strikethrough": false
  },
  "agent_meta": {
    "description": "Public HTTP entry point"
  }
}
```

MVP shape kinds are `rectangle`, `ellipse`, and `diamond`. Shape `color` is the
fill color. The application selects a contrasting content color. `border` is
either `null` or an object with a positive finite `thickness`, a `color`, and a
`style` of `solid`, `dashed`, or `dotted`.

### Standalone Text

```json
{
  "id": "8df88aae-aac4-411b-9051-b3db988262e7",
  "type": "text",
  "position": { "x": 100, "y": 260 },
  "size": { "width": 240, "height": 80 },
  "content": "Request processing",
  "color": "#111827",
  "text_style": {
    "font_family": "Roboto",
    "horizontal_alignment": "left",
    "vertical_alignment": "top",
    "bold": false,
    "italic": false,
    "underline": false,
    "strikethrough": false
  },
  "agent_meta": {}
}
```

`horizontal_alignment` accepts `left`, `center`, or `right`.
`vertical_alignment` accepts `top`, `center`, or `bottom`. The `bold`,
`italic`, `underline`, and `strikethrough` modifiers are independent booleans.
`font_family` accepts `Roboto`, `Montserrat`, `Open Sans`, `Source Sans 3`, or
`System UI`. Text inside shapes uses the same structure; connector labels do not
use `text_style` in the MVP. Legacy v1 boards without `font_family` are read
with `Roboto` and receive the explicit field on their next write.

Roboto, Montserrat, Open Sans, and Source Sans 3 are bundled under the SIL Open
Font License 1.1 through the Fontsource packages. `System UI` uses the host
operating system and does not add a bundled font license.

### Connector

```json
{
  "id": "bd8bf9ef-bd51-4674-b666-83c228a61188",
  "type": "connector",
  "connector_kind": "arrow",
  "points": [
    { "x": 340, "y": 170 },
    { "x": 500, "y": 170 }
  ],
  "source_attachment": {
    "element_id": "ed61da9c-4808-4656-b893-dae123e597fe",
    "anchor": { "x": 1, "y": 0.5 }
  },
  "target_attachment": {
    "element_id": "840a6e94-7845-49f7-9486-c124466cff51",
    "anchor": { "x": 0, "y": 0.5 }
  },
  "content": "HTTP",
  "color": "#64748b",
  "agent_meta": {}
}
```

Connector kinds are `line` and `arrow`. Connectors contain at least two
absolute points. Source and target attachments are optional and use normalized
anchor coordinates from zero to one. Stored points are fallback positions if
an attachment is removed. Connectors do not store derived `position` or `size`
values. Deleting an attached element detaches the connector and preserves its
last endpoint position.

### Format Invariants

- `schema_version` versions the persisted API independently for manifests and
  boards. Incompatible changes require sequential migrations.
- Unknown future schema versions must not be overwritten.
- `revision` is a non-negative integer incremented on each successful write to
  that file. Writes require the expected revision.
- Structure outside `agent_meta` is strict. `agent_meta` accepts nested JSON
  values and unknown entries must survive read-modify-write cycles.
- References and attachment targets are validated as domain invariants in
  addition to structural JSON Schema validation.
- Files use two-space indentation, stable field ordering, and a final newline.
- Writes use atomic file replacement. JSON files remain the source of truth.

## Architecture

The repository is a pnpm workspace with a shared strict TypeScript
configuration. Package directories are introduced only when their application
code is implemented. The intended boundaries are:

```text
apps/desktop   Electron main process, typed preload API, and React renderer
packages/core  Schemas, validation, board operations, and file storage
packages/mcp   Universal stdio MCP server and the duogram CLI
```

Node.js 22 is the minimum supported development runtime. The workspace uses
ESLint, Prettier, TypeScript project references, and Vitest. CI runs the same
quality pipeline on Windows, macOS, and Linux.

The renderer must not access the filesystem directly. Board writes use schema
validation, revision checks, and atomic file replacement. The desktop watches
project files and reloads clean boards when an agent changes them externally.

The desktop application uses an Electron main process and a context-isolated,
sandboxed preload bridge. Its React renderer provides project navigation, an
SVG canvas for MVP elements, connector endpoint attachment, and an inspector
for content, geometry, border, font, and style. The canvas supports additive
multi-selection with Shift/Ctrl/Cmd, group dragging, mouse resizing of shapes
and text blocks, automatic word wrapping inside those blocks, left-button
panning on the empty field, and wheel zoom anchored at the current viewport
center. Undo and redo are scoped to the current board and desktop session.
Autosave uses optimistic board revisions; external changes reload clean boards
and surface an explicit conflict when local edits are dirty.

## Initialized Projects

The `duogram init` command creates:

- `.duogram` for project, space, and board data.
- `.opencode/opencode.json` with a local `duogram` MCP server entry. Existing
  unrelated configuration is preserved.
- `.opencode/agents/duogram.md` and `.opencode/skills/duogram/SKILL.md` with
  generated agent guidance. Existing files at those paths are not overwritten.

Generated board data and agent metadata must survive read-modify-write cycles
without losing unknown fields.

The universal stdio server is started with `duogram mcp --project <directory>`.
It exposes project reads, space and board lifecycle tools, board reads, and
atomic element operation batches. Every mutating tool requires the revision
from the latest corresponding read.

## Delivery Targets

- Windows, macOS, and Linux desktop applications.
- Installable desktop artifacts.
- A published npm CLI and MCP package.
- A universal MCP interface with OpenCode integration provided as a template.

## Distribution

Distribution uses electron-builder for native installers and pnpm pack for
the public `@duogram/core` and `@duogram/mcp` packages. The tag-triggered Release
workflow builds on Windows, macOS, and Linux before publishing npm packages
and GitHub assets. Current desktop artifacts are unsigned development builds;
see `DISTRIBUTION.md` for publication and signing requirements.

## Development Retrieval

This repository uses `codebase-index` for local code retrieval. It stores a
derived SQLite index in `.claude/cache/codebase-index/` and does not require a
vector database or Docker. Embeddings are disabled by default; FTS5, symbols,
and dependency graphs provide the initial retrieval path.

This development index is separate from any future semantic search feature in
the Duogram product. A product-level vector store should be selected only when
its data volume, embedding model, and deployment requirements are known.
