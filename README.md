# Duogram

Duogram gives agents MCP tools for reading and editing visual boards, while
providing users with a cross-platform desktop application for viewing and
editing the same boards.

The project is in its initial development stage. See [project information](docs/INFO.md)
and the [roadmap](docs/ROADMAP.md) for the current scope and direction.

## Distribution

Build installers with `pnpm dist:desktop` and npm tarballs with `pnpm dist:npm`.
Run `pnpm smoke:install` after packing to verify an isolated CLI/MCP installation.
Artifacts are placed in `release/`. See [distribution](docs/DISTRIBUTION.md) for
the three-platform release workflow, publication access, and signing setup.

## Development

The workspace requires Node.js 22 or newer and pnpm 11.

```bash
pnpm install
pnpm check
```

Build the workspace and initialize a local project with the development CLI:

```bash
pnpm build
node packages/mcp/dist/cli.js init <project-directory> --name <project-name>
```

Run the stdio MCP server directly when testing an integration:

```bash
node packages/mcp/dist/cli.js mcp --project <project-directory>
```

Initialized projects contain `.duogram` board data and generated OpenCode
integration under `.opencode`.

Run the development desktop application after initializing a project:

```bash
pnpm --filter @duogram/desktop start
```

Choose the initialized project directory in the opening screen. The desktop
autosaves board edits and watches for changes made through MCP.
