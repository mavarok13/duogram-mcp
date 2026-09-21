import { watch, type FSWatcher } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";

import {
  applyProjectOperations,
  ProjectStorage,
  type BoardV1,
  type ProjectOperation,
  type ProjectV1,
} from "@duogram/core";

import type { ExternalChange, OpenProjectValue } from "../shared/api.js";

export class ProjectSession {
  private storage: ProjectStorage | null = null;
  private watchers: FSWatcher[] = [];
  private suppressEventsUntil = 0;

  onExternalChange: ((change: ExternalChange) => void) | null = null;

  async open(directory: string): Promise<OpenProjectValue> {
    this.close();
    const storage = new ProjectStorage(path.resolve(directory));
    const project = await storage.readProject();
    this.storage = storage;
    this.watchers = [
      watch(storage.dataDirectory, (_, fileName) => {
        if (fileName === "project.json") this.emit({ kind: "project" });
      }),
      watch(storage.boardsDirectory, (_, fileName) => {
        const match = fileName?.match(/^([0-9a-f-]+)\.json$/);
        this.emit(
          match?.[1] === undefined
            ? { kind: "unknown" }
            : { kind: "board", board_id: match[1] },
        );
      }),
    ];
    for (const watcher of this.watchers) {
      watcher.on("error", () => {
        this.emit({ kind: "unknown" });
      });
    }
    return { directory: storage.projectDirectory, project };
  }

  readProject(): Promise<ProjectV1> {
    return this.requireStorage().readProject();
  }

  readBoard(boardId: string): Promise<BoardV1> {
    return this.requireStorage().readBoard(boardId);
  }

  async writeBoard(board: BoardV1, expectedRevision: number): Promise<BoardV1> {
    this.suppressEventsUntil = Date.now() + 500;
    try {
      return await this.requireStorage().writeBoard(board, expectedRevision);
    } finally {
      this.suppressEventsUntil = Date.now() + 500;
    }
  }

  async createSpace(
    name: string,
    expectedRevision: number,
  ): Promise<ProjectV1> {
    return this.updateProject(expectedRevision, [
      { type: "add_space", space: { id: randomUUID(), name, boards: [] } },
    ]);
  }

  async renameSpace(
    spaceId: string,
    name: string,
    expectedRevision: number,
  ): Promise<ProjectV1> {
    return this.updateProject(expectedRevision, [
      { type: "rename_space", space_id: spaceId, name },
    ]);
  }

  async createBoard(
    spaceId: string,
    name: string,
    expectedRevision: number,
  ): Promise<{ project: ProjectV1; board: BoardV1 }> {
    const project = await this.requireStorage().readProject();
    const board: BoardV1 = {
      schema_version: 1,
      id: randomUUID(),
      revision: 0,
      elements: [],
    };
    const savedBoard = await this.requireStorage().writeBoard(board, -1);
    try {
      const updated = applyProjectOperations(project, expectedRevision, [
        {
          type: "add_board",
          space_id: spaceId,
          board: { id: savedBoard.id, name },
        },
      ]);
      const savedProject = await this.writeProject(updated, expectedRevision);
      return { project: savedProject, board: savedBoard };
    } catch (error) {
      await this.requireStorage().deleteBoard(
        savedBoard.id,
        savedBoard.revision,
      );
      throw error;
    }
  }

  async renameBoard(
    boardId: string,
    name: string,
    expectedRevision: number,
  ): Promise<ProjectV1> {
    return this.updateProject(expectedRevision, [
      { type: "rename_board", board_id: boardId, name },
    ]);
  }

  async moveBoard(
    boardId: string,
    targetSpaceId: string,
    targetIndex: number | undefined,
    expectedRevision: number,
  ): Promise<ProjectV1> {
    const operation: ProjectOperation =
      targetIndex === undefined
        ? {
            type: "move_board",
            board_id: boardId,
            target_space_id: targetSpaceId,
          }
        : {
            type: "move_board",
            board_id: boardId,
            target_space_id: targetSpaceId,
            target_index: targetIndex,
          };
    return this.updateProject(expectedRevision, [operation]);
  }

  async deleteBoard(
    boardId: string,
    expectedProjectRevision: number,
    expectedBoardRevision: number,
  ): Promise<ProjectV1> {
    return this.requireStorage().deleteBoardWithAction(
      boardId,
      expectedBoardRevision,
      () =>
        this.updateProject(expectedProjectRevision, [
          { type: "delete_board", board_id: boardId },
        ]),
    );
  }

  close(): void {
    for (const watcher of this.watchers) watcher.close();
    this.watchers = [];
    this.storage = null;
  }

  private requireStorage(): ProjectStorage {
    if (this.storage === null) throw new Error("no Duogram project is open");
    return this.storage;
  }

  private async updateProject(
    expectedRevision: number,
    operations: readonly ProjectOperation[],
  ): Promise<ProjectV1> {
    const project = await this.requireStorage().readProject();
    const updated = applyProjectOperations(
      project,
      expectedRevision,
      operations,
    );
    return this.writeProject(updated, expectedRevision);
  }

  private async writeProject(
    project: ProjectV1,
    expectedRevision: number,
  ): Promise<ProjectV1> {
    this.suppressEventsUntil = Date.now() + 500;
    try {
      return await this.requireStorage().writeProject(
        project,
        expectedRevision,
      );
    } finally {
      this.suppressEventsUntil = Date.now() + 500;
    }
  }

  private emit(change: ExternalChange): void {
    if (Date.now() < this.suppressEventsUntil) return;
    this.onExternalChange?.(change);
  }
}
