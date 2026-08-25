import { randomUUID } from "node:crypto";

import {
  applyBoardOperations,
  applyProjectOperations,
  ProjectStorage,
  type BoardOperation,
  type BoardV1,
  type ProjectV1,
} from "@duogram/core";

export class DuogramService {
  readonly storage: ProjectStorage;

  constructor(projectDirectory: string) {
    this.storage = new ProjectStorage(projectDirectory);
  }

  readProject(): Promise<ProjectV1> {
    return this.storage.readProject();
  }

  readBoard(boardId: string): Promise<BoardV1> {
    return this.storage.readBoard(boardId);
  }

  async createSpace(
    name: string,
    expectedRevision: number,
  ): Promise<ProjectV1> {
    return this.updateProject(expectedRevision, [
      {
        type: "add_space",
        space: { id: randomUUID(), name, boards: [] },
      },
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

  async deleteSpace(
    spaceId: string,
    expectedRevision: number,
  ): Promise<ProjectV1> {
    return this.updateProject(expectedRevision, [
      { type: "delete_space", space_id: spaceId },
    ]);
  }

  async createBoard(
    spaceId: string,
    name: string,
    expectedRevision: number,
  ): Promise<{ project: ProjectV1; board: BoardV1 }> {
    const project = await this.storage.readProject();
    const board: BoardV1 = {
      schema_version: 1,
      id: randomUUID(),
      revision: 0,
      elements: [],
    };
    const savedBoard = await this.storage.writeBoard(board, -1);
    try {
      const updated = applyProjectOperations(project, expectedRevision, [
        {
          type: "add_board",
          space_id: spaceId,
          board: { id: savedBoard.id, name },
        },
      ]);
      const savedProject = await this.storage.writeProject(
        updated,
        expectedRevision,
      );
      return { project: savedProject, board: savedBoard };
    } catch (error) {
      await this.storage.deleteBoard(savedBoard.id, savedBoard.revision);
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
    expectedRevision: number,
  ): Promise<ProjectV1> {
    return this.updateProject(expectedRevision, [
      {
        type: "move_board",
        board_id: boardId,
        target_space_id: targetSpaceId,
      },
    ]);
  }

  async deleteBoard(
    boardId: string,
    expectedProjectRevision: number,
    expectedBoardRevision: number,
  ): Promise<ProjectV1> {
    return this.storage.deleteBoardWithAction(
      boardId,
      expectedBoardRevision,
      async () =>
        this.updateProject(expectedProjectRevision, [
          { type: "delete_board", board_id: boardId },
        ]),
    );
  }

  async applyOperations(
    boardId: string,
    expectedRevision: number,
    operations: readonly BoardOperation[],
  ): Promise<BoardV1> {
    const board = await this.storage.readBoard(boardId);
    const updated = applyBoardOperations(board, expectedRevision, operations);
    return this.storage.writeBoard(updated, expectedRevision);
  }

  private async updateProject(
    expectedRevision: number,
    operations: Parameters<typeof applyProjectOperations>[2],
  ): Promise<ProjectV1> {
    const project = await this.storage.readProject();
    const updated = applyProjectOperations(
      project,
      expectedRevision,
      operations,
    );
    return this.storage.writeProject(updated, expectedRevision);
  }
}
