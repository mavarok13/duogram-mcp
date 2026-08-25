import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import {
  access,
  mkdir,
  open,
  readFile,
  rename,
  unlink,
} from "node:fs/promises";
import path from "node:path";

import { ProjectStorage, type BoardV1, type ProjectV1 } from "@duogram/core";

import {
  DUOGRAM_AGENT,
  DUOGRAM_MCP_CONFIG,
  DUOGRAM_SKILL,
  OPENCODE_CONFIG_SCHEMA,
} from "./templates.js";

export interface InitializeResult {
  project: ProjectV1;
  board: BoardV1;
  created_files: string[];
}

export async function initializeProject(
  projectDirectory: string,
  name = path.basename(path.resolve(projectDirectory)),
): Promise<InitializeResult> {
  const directory = path.resolve(projectDirectory);
  const storage = new ProjectStorage(directory);
  if (await exists(storage.dataDirectory)) {
    throw new Error(`Duogram project already exists: ${storage.dataDirectory}`);
  }

  await mkdir(directory, { recursive: true });
  const openCodeConfig = await prepareOpenCodeConfig(directory);
  const board: BoardV1 = {
    schema_version: 1,
    id: randomUUID(),
    revision: 0,
    elements: [],
  };
  const spaceId = randomUUID();
  const project: ProjectV1 = {
    schema_version: 1,
    id: randomUUID(),
    name,
    revision: 0,
    spaces: [
      {
        id: spaceId,
        name: "Main",
        boards: [{ id: board.id, name: "Board 1" }],
      },
    ],
  };

  const savedBoard = await storage.writeBoard(board, -1);
  const savedProject = await storage.writeProject(project, -1);
  const createdFiles = [
    path.relative(directory, storage.projectPath),
    path.relative(
      directory,
      path.join(storage.boardsDirectory, `${board.id}.json`),
    ),
  ];
  createdFiles.push(
    ...(await installOpenCodeIntegration(directory, openCodeConfig)),
  );
  return {
    project: savedProject,
    board: savedBoard,
    created_files: createdFiles,
  };
}

async function installOpenCodeIntegration(
  projectDirectory: string,
  config: Record<string, unknown>,
): Promise<string[]> {
  const opencodeDirectory = path.join(projectDirectory, ".opencode");
  const configPath = path.join(opencodeDirectory, "opencode.json");
  const agentPath = path.join(opencodeDirectory, "agents", "duogram.md");
  const skillPath = path.join(
    opencodeDirectory,
    "skills",
    "duogram",
    "SKILL.md",
  );
  await mkdir(path.dirname(agentPath), { recursive: true });
  await mkdir(path.dirname(skillPath), { recursive: true });

  const mcp = asRecord(config["mcp"]);
  config["$schema"] ??= OPENCODE_CONFIG_SCHEMA;
  config["mcp"] = { ...mcp, duogram: DUOGRAM_MCP_CONFIG };
  await atomicWrite(configPath, `${JSON.stringify(config, null, 2)}\n`);

  const created = [path.relative(projectDirectory, configPath)];
  if (await writeExclusive(agentPath, DUOGRAM_AGENT)) {
    created.push(path.relative(projectDirectory, agentPath));
  }
  if (await writeExclusive(skillPath, DUOGRAM_SKILL)) {
    created.push(path.relative(projectDirectory, skillPath));
  }
  return created;
}

async function prepareOpenCodeConfig(
  projectDirectory: string,
): Promise<Record<string, unknown>> {
  const configPath = path.join(projectDirectory, ".opencode", "opencode.json");
  const config = await readConfig(configPath);
  const existingMcp = config["mcp"];
  if (existingMcp !== undefined && !isRecord(existingMcp)) {
    throw new Error(`OpenCode mcp config must be a JSON object: ${configPath}`);
  }
  if (isRecord(existingMcp) && existingMcp["duogram"] !== undefined) {
    throw new Error(`OpenCode MCP entry already exists: ${configPath}`);
  }
  return config;
}

async function readConfig(
  configPath: string,
): Promise<Record<string, unknown>> {
  if (!(await exists(configPath))) return {};
  const value: unknown = JSON.parse(await readFile(configPath, "utf8"));
  if (!isRecord(value)) {
    throw new Error(`OpenCode config must be a JSON object: ${configPath}`);
  }
  return value;
}

async function writeExclusive(
  filePath: string,
  contents: string,
): Promise<boolean> {
  try {
    const file = await open(filePath, "wx");
    try {
      await file.writeFile(contents, "utf8");
    } finally {
      await file.close();
    }
    return true;
  } catch (error) {
    if (isErrorCode(error, "EEXIST")) return false;
    throw error;
  }
}

async function atomicWrite(filePath: string, contents: string): Promise<void> {
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  const file = await open(temporaryPath, "wx", 0o600);
  try {
    await file.writeFile(contents, "utf8");
    await file.sync();
  } finally {
    await file.close();
  }
  try {
    await rename(temporaryPath, filePath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch (error) {
    if (isErrorCode(error, "ENOENT")) return false;
    throw error;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}
