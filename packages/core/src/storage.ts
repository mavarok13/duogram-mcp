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
import { randomUUID } from "node:crypto";

import {
  DuogramValidationError,
  RevisionConflictError,
  StorageLockError,
} from "./errors.js";
import type { BoardV1, ProjectV1 } from "./types.js";
import {
  parseBoardJson,
  parseProjectJson,
  validateBoard,
  validateProject,
} from "./validation.js";

export const DUOGRAM_DIRECTORY = ".duogram";

export class ProjectStorage {
  readonly projectDirectory: string;
  readonly dataDirectory: string;
  readonly boardsDirectory: string;
  readonly projectPath: string;

  constructor(projectDirectory: string) {
    this.projectDirectory = projectDirectory;
    this.dataDirectory = path.join(projectDirectory, DUOGRAM_DIRECTORY);
    this.boardsDirectory = path.join(this.dataDirectory, "boards");
    this.projectPath = path.join(this.dataDirectory, "project.json");
  }

  async readProject(): Promise<ProjectV1> {
    const project = parseProjectJson(await readFile(this.projectPath, "utf8"));
    for (const summary of project.spaces.flatMap((space) => space.boards)) {
      const board = await this.readBoard(summary.id);
      if (board.id !== summary.id) {
        throw new DuogramValidationError(
          `board file ${summary.id}.json contains board ID ${board.id}`,
        );
      }
    }
    return project;
  }

  async readBoard(boardId: string): Promise<BoardV1> {
    return parseBoardJson(await readFile(this.boardPath(boardId), "utf8"));
  }

  async writeProject(
    project: ProjectV1,
    expectedRevision: number,
  ): Promise<ProjectV1> {
    return this.writeVersioned(
      this.projectPath,
      project,
      expectedRevision,
      parseProjectJson,
      validateProject,
    );
  }

  async writeBoard(board: BoardV1, expectedRevision: number): Promise<BoardV1> {
    return this.writeVersioned(
      this.boardPath(board.id),
      board,
      expectedRevision,
      parseBoardJson,
      validateBoard,
    );
  }

  async deleteBoard(boardId: string, expectedRevision: number): Promise<void> {
    await this.deleteBoardWithAction(boardId, expectedRevision, () =>
      Promise.resolve(),
    );
  }

  async deleteBoardWithAction<T>(
    boardId: string,
    expectedRevision: number,
    beforeDelete: () => Promise<T>,
  ): Promise<T> {
    const filePath = this.boardPath(boardId);
    return withLock(filePath, async () => {
      const board = await this.readBoard(boardId);
      if (board.revision !== expectedRevision) {
        throw new RevisionConflictError(expectedRevision, board.revision);
      }
      const result = await beforeDelete();
      await unlink(filePath);
      return result;
    });
  }

  private boardPath(boardId: string): string {
    if (!/^[0-9a-f-]+$/.test(boardId)) {
      throw new DuogramValidationError(`invalid board ID for path: ${boardId}`);
    }
    return path.join(this.boardsDirectory, `${boardId}.json`);
  }

  private async writeVersioned<T extends { revision: number }>(
    filePath: string,
    value: T,
    expectedRevision: number,
    parse: (json: string) => T,
    validate: (value: unknown) => T,
  ): Promise<T> {
    await mkdir(path.dirname(filePath), { recursive: true });
    return withLock(filePath, async () => {
      const exists = await fileExists(filePath);
      const actualRevision = exists
        ? parse(await readFile(filePath, "utf8")).revision
        : -1;
      if (actualRevision !== expectedRevision) {
        throw new RevisionConflictError(expectedRevision, actualRevision);
      }

      const next = validate({ ...value, revision: expectedRevision + 1 });
      await atomicWrite(filePath, `${JSON.stringify(next, null, 2)}\n`);
      return next;
    });
  }
}

async function withLock<T>(
  filePath: string,
  action: () => Promise<T>,
): Promise<T> {
  const lockPath = `${filePath}.lock`;
  let lock = null;
  for (let attempt = 0; attempt < 200 && lock === null; attempt += 1) {
    try {
      lock = await open(lockPath, "wx");
    } catch (error) {
      if (!isErrorCode(error, "EEXIST")) throw error;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  if (lock === null) throw new StorageLockError(filePath);

  try {
    return await action();
  } finally {
    await lock.close();
    await unlink(lockPath).catch((error: unknown) => {
      if (!isErrorCode(error, "ENOENT")) throw error;
    });
  }
}

async function atomicWrite(filePath: string, contents: string): Promise<void> {
  const temporaryPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${randomUUID()}.tmp`,
  );
  const temporary = await open(temporaryPath, "wx", 0o600);
  try {
    await temporary.writeFile(contents, "utf8");
    await temporary.sync();
  } finally {
    await temporary.close();
  }

  try {
    await rename(temporaryPath, filePath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch (error) {
    if (isErrorCode(error, "ENOENT")) return false;
    throw error;
  }
}

function isErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}
