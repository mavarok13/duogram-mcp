import { RevisionConflictError } from "./errors.js";
import type {
  BoardOperation,
  BoardV1,
  Element,
  Point,
  ShapeElement,
  TextElement,
} from "./types.js";
import { validateBoard } from "./validation.js";

export function applyBoardOperations(
  board: BoardV1,
  expectedRevision: number,
  operations: readonly BoardOperation[],
): BoardV1 {
  if (board.revision !== expectedRevision) {
    throw new RevisionConflictError(expectedRevision, board.revision);
  }

  const elements = structuredClone(board.elements);
  for (const operation of operations) {
    const index = elements.findIndex((element) =>
      operation.type === "delete"
        ? element.id === operation.element_id
        : element.id === operation.element.id,
    );

    if (operation.type === "add") {
      if (index !== -1)
        throw new Error(`element already exists: ${operation.element.id}`);
      elements.push(structuredClone(operation.element));
    } else if (operation.type === "update") {
      if (index === -1)
        throw new Error(`element does not exist: ${operation.element.id}`);
      elements[index] = structuredClone(operation.element);
    } else {
      if (index === -1)
        throw new Error(`element does not exist: ${operation.element_id}`);
      const removed = elements[index];
      if (removed === undefined) throw new Error("unreachable missing element");
      elements.splice(index, 1);
      if (removed.type !== "connector") detachFromElement(elements, removed);
    }
  }

  return validateBoard({
    ...board,
    revision: board.revision + 1,
    elements,
  });
}

function detachFromElement(
  elements: Element[],
  removed: ShapeElement | TextElement,
): void {
  for (const element of elements) {
    if (element.type !== "connector") continue;
    if (element.source_attachment?.element_id === removed.id) {
      element.points[0] = anchorPoint(
        removed,
        element.source_attachment.anchor,
      );
      delete element.source_attachment;
    }
    if (element.target_attachment?.element_id === removed.id) {
      element.points[element.points.length - 1] = anchorPoint(
        removed,
        element.target_attachment.anchor,
      );
      delete element.target_attachment;
    }
  }
}

function anchorPoint(
  element: ShapeElement | TextElement,
  anchor: Point,
): Point {
  return {
    x: element.position.x + element.size.width * anchor.x,
    y: element.position.y + element.size.height * anchor.y,
  };
}
