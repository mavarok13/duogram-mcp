export const OPENCODE_CONFIG_SCHEMA = "https://opencode.ai/config.json";

export const DUOGRAM_MCP_CONFIG = {
  type: "local",
  command: ["npx", "-y", "@duogram/mcp", "mcp", "--project", "."],
  enabled: true,
} as const;

export const DUOGRAM_AGENT = `---
description: Creates and updates Duogram visual boards through the project MCP server.
mode: subagent
---

Use the Duogram MCP tools to inspect the project before changing boards. Always pass
the revisions returned by the latest read into mutating tools. Prefer one atomic
element batch for related board edits. Do not edit files under .duogram directly.
`;

export const DUOGRAM_SKILL = `---
name: duogram
description: Use when creating, reading, or editing Duogram spaces, boards, diagrams, shapes, text, lines, or arrows through MCP.
---

# Duogram

Read the project and target board before editing. Mutations use optimistic revisions,
so pass the revision from the latest read and retry only after reading fresh data.
Group related element additions, updates, and deletions into one board operation batch.
Use attachments for connector endpoints that should follow shapes or text elements.
Never edit JSON files in .duogram directly.
`;
