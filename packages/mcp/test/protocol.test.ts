import { randomUUID } from "node:crypto";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it } from "vitest";

import { initializeProject } from "../src/initialize.js";
import { createMcpServer } from "../src/server.js";
import { removeTemporaryDirectories, temporaryDirectory } from "./helpers.js";

afterEach(removeTemporaryDirectories);

describe("MCP protocol", () => {
  it("negotiates, lists tools, executes mutations, and reports conflicts", async () => {
    const directory = await temporaryDirectory();
    const initialized = await initializeProject(directory);
    const server = createMcpServer(directory);
    const client = new Client({ name: "duogram-test", version: "1.0.0" });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);
    await client.connect(clientTransport);
    try {
      const tools = await client.listTools();
      expect(tools.tools.map((tool) => tool.name)).toEqual([
        "project_read",
        "space_create",
        "space_rename",
        "space_delete",
        "board_create",
        "board_read",
        "board_rename",
        "board_move",
        "board_delete",
        "board_apply_operations",
      ]);

      const read = await client.callTool({
        name: "project_read",
        arguments: {},
      });
      expect(read.structuredContent).toMatchObject({
        result: { id: initialized.project.id, revision: 0 },
      });

      const boardId = initialized.board.id;
      const mutation = await client.callTool({
        name: "board_apply_operations",
        arguments: {
          board_id: boardId,
          expected_revision: 0,
          operations: [
            {
              type: "add",
              element: {
                id: randomUUID(),
                type: "text",
                position: { x: 10, y: 20 },
                size: { width: 200, height: 50 },
                content: "Hello",
                color: "#111827",
                text_style: {
                  font_family: "Roboto",
                  horizontal_alignment: "left",
                  vertical_alignment: "top",
                  bold: false,
                  italic: false,
                  underline: false,
                  strikethrough: false,
                },
                agent_meta: { source: "protocol-test" },
              },
            },
          ],
        },
      });
      expect(mutation.isError).not.toBe(true);
      expect(mutation.structuredContent).toMatchObject({
        result: { revision: 1, elements: [{ content: "Hello" }] },
      });

      const conflict = await client.callTool({
        name: "board_apply_operations",
        arguments: {
          board_id: boardId,
          expected_revision: 0,
          operations: [{ type: "delete", element_id: randomUUID() }],
        },
      });
      expect(conflict.isError).toBe(true);
    } finally {
      await client.close();
      await server.close();
    }
  });
});
