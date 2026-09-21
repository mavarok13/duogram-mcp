import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  ProjectStorage,
  RevisionConflictError,
  type BoardV1,
  type ProjectV1,
} from "@duogram/core";

import { ProjectSession } from "../src/main/project-session.js";

const directories: string[] = [];
const sessions: ProjectSession[] = [];

afterEach(async () => {
  for (const session of sessions.splice(0)) session.close();
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function fixture(): Promise<{
  directory: string;
  storage: ProjectStorage;
  board: BoardV1;
}> {
  const directory = await mkdtemp(path.join(tmpdir(), "duogram-desktop-"));
  directories.push(directory);
  const storage = new ProjectStorage(directory);
  const board: BoardV1 = {
    schema_version: 1,
    id: randomUUID(),
    revision: 0,
    elements: [],
  };
  const project: ProjectV1 = {
    schema_version: 1,
    id: randomUUID(),
    name: "Desktop test",
    revision: 0,
    spaces: [
      {
        id: randomUUID(),
        name: "Main",
        boards: [{ id: board.id, name: "Board 1" }],
      },
    ],
  };
  await storage.writeBoard(board, -1);
  await storage.writeProject(project, -1);
  return { directory, storage, board };
}

describe("desktop project session", () => {
  it("opens projects and applies revision-checked writes", async () => {
    const value = await fixture();
    const session = new ProjectSession();
    sessions.push(session);

    const opened = await session.open(value.directory);
    const saved = await session.writeBoard(
      { ...value.board, elements: [] },
      value.board.revision,
    );

    expect(opened.project.name).toBe("Desktop test");
    expect(saved.revision).toBe(1);
    await expect(
      session.writeBoard(saved, value.board.revision),
    ).rejects.toBeInstanceOf(RevisionConflictError);
  });

  it("reports board changes written by another process", async () => {
    const value = await fixture();
    const session = new ProjectSession();
    sessions.push(session);
    await session.open(value.directory);

    const change = new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("watch timeout"));
      }, 3000);
      session.onExternalChange = (event) => {
        if (event.kind === "board") {
          clearTimeout(timeout);
          resolve(event.board_id);
        }
      };
    });
    await value.storage.writeBoard(value.board, 0);

    await expect(change).resolves.toBe(value.board.id);
  });

  it("applies revision-checked space and board lifecycle changes", async () => {
    const value = await fixture();
    const session = new ProjectSession();
    sessions.push(session);
    const opened = await session.open(value.directory);
    const initialSpace = opened.project.spaces[0];
    if (initialSpace === undefined) throw new Error("missing fixture space");

    const withSpace = await session.createSpace(
      "Design",
      opened.project.revision,
    );
    const space = withSpace.spaces[1];
    if (space === undefined) throw new Error("missing created space");
    const created = await session.createBoard(
      space.id,
      "Draft",
      withSpace.revision,
    );
    const renamed = await session.renameBoard(
      created.board.id,
      "Final",
      created.project.revision,
    );
    const moved = await session.moveBoard(
      created.board.id,
      initialSpace.id,
      undefined,
      renamed.revision,
    );
    const deleted = await session.deleteBoard(
      created.board.id,
      moved.revision,
      created.board.revision,
    );

    expect(deleted.spaces[0]?.boards).toEqual([
      { id: value.board.id, name: "Board 1" },
    ]);
  });
});
