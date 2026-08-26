import { DuogramValidationError } from "./errors.js";
import type { BoardV1, ProjectV1 } from "./types.js";

export function assertProjectInvariants(project: ProjectV1): void {
  assertUnique(
    project.spaces.map((space) => space.id),
    "space IDs",
  );
  assertUnique(
    project.spaces.flatMap((space) => space.boards.map((board) => board.id)),
    "board IDs",
  );
}

export function assertBoardInvariants(board: BoardV1): void {
  assertUnique(
    board.elements.map((element) => element.id),
    "element IDs",
  );
  const attachableIds = new Set(
    board.elements
      .filter((element) => element.type !== "connector")
      .map((element) => element.id),
  );

  for (const element of board.elements) {
    if (element.type !== "connector") continue;
    for (const attachment of [
      element.source_attachment,
      element.target_attachment,
    ]) {
      if (
        attachment !== undefined &&
        !attachableIds.has(attachment.element_id)
      ) {
        throw new DuogramValidationError(
          `connector ${element.id} attaches to missing or non-attachable element ${attachment.element_id}`,
        );
      }
    }
  }
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw new DuogramValidationError(`${label} must be unique`);
  }
}
