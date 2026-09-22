# Duogram 0.1.0

First release of the local-first visual board system:

- Electron desktop with shapes, text, arrows, board navigation, autosave,
  session undo/redo, and external-edit conflict handling.
- CLI project initialization and ten universal stdio MCP tools.
- Revision-checked JSON storage with atomic writes and metadata preservation.

Desktop artifacts are unsigned. Windows builds target x64, macOS builds target
the hosted runner architecture (arm64), and Linux builds target x64.
Node.js 22 or newer is required for the CLI; desktop includes its own runtime.

Install the CLI with `npm install -g @duogram/mcp@0.1.0`, then run
`duogram init <directory>` and open that directory in the desktop application.
