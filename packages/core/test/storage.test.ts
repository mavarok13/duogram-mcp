import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { ProjectStorage, RevisionConflictError } from "../src/index.js";
import { board, project } from "./fixtures.js";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function storage(): Promise<ProjectStorage> {
  const directory = await mkdtemp(path.join(tmpdir(), "duogram-core-"));
  directories.push(directory);
  return new ProjectStorage(directory);
}

describe("project storage", () => {
  it("creates stable, newline-terminated JSON and resolves manifest boards", async () => {
    const store = await storage();
    const savedBoard = await store.writeBoard(board(), -1);
    const savedProject = await store.writeProject(project(), -1);

    expect(savedBoard.revision).toBe(0);
    expect(savedProject.revision).toBe(0);
    await expect(store.readProject()).resolves.toEqual(savedProject);
    const raw = await readFile(store.projectPath, "utf8");
    expect(raw.endsWith("\n")).toBe(true);
    expect(raw).toContain('\n  "schema_version": 1,');
  });

  it("allows only one of two concurrent writes at the same revision", async () => {
    const store = await storage();
    const initial = await store.writeBoard(board(), -1);
    const first = { ...initial, elements: [] };
    const second = structuredClone(initial);
    const competingElement = second.elements[0];
    if (competingElement === undefined) throw new Error("invalid fixture");
    competingElement.content = "competing write";

    const results = await Promise.allSettled([
      store.writeBoard(first, 0),
      store.writeBoard(second, 0),
    ]);

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected).toBeDefined();
    if (rejected?.status !== "rejected") throw new Error("expected rejection");
    expect(rejected.reason).toBeInstanceOf(RevisionConflictError);
  });

  it("rejects a stale expected revision", async () => {
    const store = await storage();
    const initial = await store.writeBoard(board(), -1);

    await expect(store.writeBoard(initial, 3)).rejects.toBeInstanceOf(
      RevisionConflictError,
    );
  });

  it("deletes a board only at its expected revision", async () => {
    const store = await storage();
    const initial = await store.writeBoard(board(), -1);

    await expect(store.deleteBoard(initial.id, 2)).rejects.toBeInstanceOf(
      RevisionConflictError,
    );
    await store.deleteBoard(initial.id, 0);
    await expect(store.readBoard(initial.id)).rejects.toMatchObject({
      code: "ENOENT",
    });
  });
});
