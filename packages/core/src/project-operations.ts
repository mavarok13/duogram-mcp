import { RevisionConflictError } from "./errors.js";
import type {
  BoardSummary,
  ProjectOperation,
  ProjectV1,
  Space,
} from "./types.js";
import { validateProject } from "./validation.js";

export function applyProjectOperations(
  project: ProjectV1,
  expectedRevision: number,
  operations: readonly ProjectOperation[],
): ProjectV1 {
  if (project.revision !== expectedRevision) {
    throw new RevisionConflictError(expectedRevision, project.revision);
  }

  const spaces = structuredClone(project.spaces);
  for (const operation of operations) {
    switch (operation.type) {
      case "add_space":
        addSpace(spaces, operation.space);
        break;
      case "rename_space":
        findSpace(spaces, operation.space_id).name = operation.name;
        break;
      case "delete_space":
        deleteSpace(spaces, operation.space_id);
        break;
      case "add_board":
        addBoard(spaces, operation.space_id, operation.board);
        break;
      case "rename_board":
        findBoard(spaces, operation.board_id).board.name = operation.name;
        break;
      case "move_board":
        moveBoard(spaces, operation.board_id, operation.target_space_id);
        break;
      case "delete_board":
        deleteBoard(spaces, operation.board_id);
        break;
    }
  }

  return validateProject({
    ...project,
    revision: project.revision + 1,
    spaces,
  });
}

function addSpace(spaces: Space[], space: Space): void {
  if (spaces.some((candidate) => candidate.id === space.id)) {
    throw new Error(`space already exists: ${space.id}`);
  }
  spaces.push(structuredClone(space));
}

function deleteSpace(spaces: Space[], spaceId: string): void {
  const index = spaces.findIndex((space) => space.id === spaceId);
  if (index === -1) throw new Error(`space does not exist: ${spaceId}`);
  const space = spaces[index];
  if (space === undefined) throw new Error("unreachable missing space");
  if (space.boards.length > 0) {
    throw new Error(`space is not empty: ${spaceId}`);
  }
  spaces.splice(index, 1);
}

function addBoard(spaces: Space[], spaceId: string, board: BoardSummary): void {
  if (
    spaces.some((space) => space.boards.some((item) => item.id === board.id))
  ) {
    throw new Error(`board already exists: ${board.id}`);
  }
  findSpace(spaces, spaceId).boards.push(structuredClone(board));
}

function moveBoard(
  spaces: Space[],
  boardId: string,
  targetSpaceId: string,
): void {
  const located = findBoard(spaces, boardId);
  const target = findSpace(spaces, targetSpaceId);
  if (located.space === target) return;
  located.space.boards.splice(located.index, 1);
  target.boards.push(located.board);
}

function deleteBoard(spaces: Space[], boardId: string): void {
  const located = findBoard(spaces, boardId);
  located.space.boards.splice(located.index, 1);
}

function findSpace(spaces: Space[], spaceId: string): Space {
  const space = spaces.find((candidate) => candidate.id === spaceId);
  if (space === undefined) throw new Error(`space does not exist: ${spaceId}`);
  return space;
}

function findBoard(
  spaces: Space[],
  boardId: string,
): { space: Space; board: BoardSummary; index: number } {
  for (const space of spaces) {
    const index = space.boards.findIndex((board) => board.id === boardId);
    const board = space.boards[index];
    if (board !== undefined) return { space, board, index };
  }
  throw new Error(`board does not exist: ${boardId}`);
}
