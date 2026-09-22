import type { BoardOperation } from "@duogram/core";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";

import { DuogramService } from "./service.js";
import { toolFields } from "./tool-schemas.js";

const readOnly = { readOnlyHint: true, idempotentHint: true } as const;
const mutating = { readOnlyHint: false, idempotentHint: false } as const;

export function createMcpServer(projectDirectory: string): McpServer {
  const service = new DuogramService(projectDirectory);
  const server = new McpServer({ name: "duogram", version: "0.1.0" });

  server.registerTool(
    "project_read",
    {
      description:
        "Read the Duogram project, spaces, boards, and current revision.",
      annotations: readOnly,
    },
    async () => toolResult(await service.readProject()),
  );

  server.registerTool(
    "space_create",
    {
      description: "Create a space at the end of the project.",
      inputSchema: {
        name: toolFields.name,
        expected_revision: toolFields.revision,
      },
      annotations: mutating,
    },
    async ({ name, expected_revision }) =>
      toolResult(await service.createSpace(name, expected_revision)),
  );

  server.registerTool(
    "space_rename",
    {
      description: "Rename an existing space.",
      inputSchema: {
        space_id: toolFields.uuid,
        name: toolFields.name,
        expected_revision: toolFields.revision,
      },
      annotations: mutating,
    },
    async ({ space_id, name, expected_revision }) =>
      toolResult(await service.renameSpace(space_id, name, expected_revision)),
  );

  server.registerTool(
    "space_delete",
    {
      description:
        "Delete an empty space. Boards must be deleted or moved first.",
      inputSchema: {
        space_id: toolFields.uuid,
        expected_revision: toolFields.revision,
      },
      annotations: mutating,
    },
    async ({ space_id, expected_revision }) =>
      toolResult(await service.deleteSpace(space_id, expected_revision)),
  );

  server.registerTool(
    "board_create",
    {
      description: "Create an empty board in a space.",
      inputSchema: {
        space_id: toolFields.uuid,
        name: toolFields.name,
        expected_revision: toolFields.revision,
      },
      annotations: mutating,
    },
    async ({ space_id, name, expected_revision }) =>
      toolResult(await service.createBoard(space_id, name, expected_revision)),
  );

  server.registerTool(
    "board_read",
    {
      description: "Read a board and all elements at its current revision.",
      inputSchema: { board_id: toolFields.uuid },
      annotations: readOnly,
    },
    async ({ board_id }) => toolResult(await service.readBoard(board_id)),
  );

  server.registerTool(
    "board_rename",
    {
      description: "Rename a board without changing its ID or data file.",
      inputSchema: {
        board_id: toolFields.uuid,
        name: toolFields.name,
        expected_revision: toolFields.revision,
      },
      annotations: mutating,
    },
    async ({ board_id, name, expected_revision }) =>
      toolResult(await service.renameBoard(board_id, name, expected_revision)),
  );

  server.registerTool(
    "board_move",
    {
      description:
        "Move a board to another space without moving its data file.",
      inputSchema: {
        board_id: toolFields.uuid,
        target_space_id: toolFields.uuid,
        expected_revision: toolFields.revision,
      },
      annotations: mutating,
    },
    async ({ board_id, target_space_id, expected_revision }) =>
      toolResult(
        await service.moveBoard(board_id, target_space_id, expected_revision),
      ),
  );

  server.registerTool(
    "board_delete",
    {
      description: "Remove a board from the project and delete its data file.",
      inputSchema: {
        board_id: toolFields.uuid,
        expected_project_revision: toolFields.revision,
        expected_board_revision: toolFields.revision,
      },
      annotations: mutating,
    },
    async ({ board_id, expected_project_revision, expected_board_revision }) =>
      toolResult(
        await service.deleteBoard(
          board_id,
          expected_project_revision,
          expected_board_revision,
        ),
      ),
  );

  server.registerTool(
    "board_apply_operations",
    {
      description:
        "Atomically apply ordered add, update, and delete element operations to one board.",
      inputSchema: {
        board_id: toolFields.uuid,
        expected_revision: toolFields.revision,
        operations: z.array(toolFields.boardOperation).min(1),
      },
      annotations: mutating,
    },
    async ({ board_id, expected_revision, operations }) =>
      toolResult(
        await service.applyOperations(
          board_id,
          expected_revision,
          operations as readonly BoardOperation[],
        ),
      ),
  );

  return server;
}

export async function runStdioServer(projectDirectory: string): Promise<void> {
  const server = createMcpServer(projectDirectory);
  await server.connect(new StdioServerTransport());
}

function toolResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
    structuredContent: { result: value },
  };
}
