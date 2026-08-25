import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { initializeProject } from "../src/index.js";
import { removeTemporaryDirectories, temporaryDirectory } from "./helpers.js";

afterEach(removeTemporaryDirectories);

describe("project initialization", () => {
  it("creates board data and merges the OpenCode integration", async () => {
    const directory = await temporaryDirectory();
    const configDirectory = path.join(directory, ".opencode");
    await mkdir(configDirectory, { recursive: true });
    await writeFile(
      path.join(configDirectory, "opencode.json"),
      `${JSON.stringify({ share: "disabled", mcp: { existing: { enabled: false } } })}\n`,
      "utf8",
    );

    const result = await initializeProject(directory, "Example");

    expect(result.project.name).toBe("Example");
    expect(result.project.spaces[0]?.boards[0]?.id).toBe(result.board.id);
    const config: unknown = JSON.parse(
      await readFile(path.join(configDirectory, "opencode.json"), "utf8"),
    );
    expect(config).toMatchObject({
      $schema: "https://opencode.ai/config.json",
      share: "disabled",
      mcp: {
        existing: { enabled: false },
        duogram: {
          type: "local",
          command: ["npx", "-y", "@duogram/mcp", "mcp", "--project", "."],
          enabled: true,
        },
      },
    });
    await expect(
      access(path.join(configDirectory, "agents", "duogram.md")),
    ).resolves.toBeUndefined();
    await expect(
      access(path.join(configDirectory, "skills", "duogram", "SKILL.md")),
    ).resolves.toBeUndefined();
  });

  it("fails before creating board data when the MCP entry exists", async () => {
    const directory = await temporaryDirectory();
    const configDirectory = path.join(directory, ".opencode");
    await mkdir(configDirectory, { recursive: true });
    await writeFile(
      path.join(configDirectory, "opencode.json"),
      `${JSON.stringify({ mcp: { duogram: { enabled: false } } })}\n`,
      "utf8",
    );

    await expect(initializeProject(directory)).rejects.toThrow(
      /MCP entry already exists/,
    );
    await expect(
      access(path.join(directory, ".duogram")),
    ).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("does not reinitialize an existing Duogram project", async () => {
    const directory = await temporaryDirectory();
    await initializeProject(directory);

    await expect(initializeProject(directory)).rejects.toThrow(
      /project already exists/,
    );
  });
});
