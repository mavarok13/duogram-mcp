import { afterEach, describe, expect, it } from "vitest";

import { RevisionConflictError } from "@duogram/core";

import { initializeProject } from "../src/initialize.js";
import { DuogramService } from "../src/service.js";
import { removeTemporaryDirectories, temporaryDirectory } from "./helpers.js";

afterEach(removeTemporaryDirectories);

describe("Duogram service", () => {
  it("runs the complete space and board lifecycle", async () => {
    const directory = await temporaryDirectory();
    const initialized = await initializeProject(directory);
    const service = new DuogramService(directory);

    const withSpace = await service.createSpace("Archive", 0);
    const archive = withSpace.spaces[1];
    if (archive === undefined) throw new Error("missing created space");
    const created = await service.createBoard(archive.id, "Flows", 1);
    const renamed = await service.renameBoard(created.board.id, "Requests", 2);
    const main = initialized.project.spaces[0];
    if (main === undefined) throw new Error("missing main space");
    const moved = await service.moveBoard(created.board.id, main.id, 3);
    const afterDelete = await service.deleteBoard(created.board.id, 4, 0);
    const finalProject = await service.deleteSpace(archive.id, 5);

    expect(renamed.revision).toBe(3);
    expect(moved.spaces[0]?.boards.at(-1)?.name).toBe("Requests");
    expect(afterDelete.revision).toBe(5);
    expect(finalProject.spaces).toHaveLength(1);
    await expect(service.readBoard(created.board.id)).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("keeps the manifest unchanged when board deletion conflicts", async () => {
    const directory = await temporaryDirectory();
    const initialized = await initializeProject(directory);
    const service = new DuogramService(directory);

    await expect(
      service.deleteBoard(initialized.board.id, 0, 4),
    ).rejects.toBeInstanceOf(RevisionConflictError);

    await expect(service.readBoard(initialized.board.id)).resolves.toEqual(
      initialized.board,
    );
    await expect(service.readProject()).resolves.toEqual(initialized.project);
  });
});
