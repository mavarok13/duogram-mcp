import { describe, expect, it } from "vitest";

import { applyBoardOperations, RevisionConflictError } from "../src/index.js";
import { board, IDs } from "./fixtures.js";

describe("board operations", () => {
  it("applies a batch without mutating its input", () => {
    const original = board();
    const replacement = structuredClone(original.elements[0]);
    if (replacement?.type !== "shape") throw new Error("invalid fixture");
    replacement.content = "Updated";

    const result = applyBoardOperations(original, 0, [
      { type: "update", element: replacement },
    ]);

    expect(result.revision).toBe(1);
    expect(result.elements[0]?.content).toBe("Updated");
    expect(original.elements[0]?.content).toBe("Service");
  });

  it("detaches connectors at the last derived endpoint on deletion", () => {
    const result = applyBoardOperations(board(), 0, [
      { type: "delete", element_id: IDs.shape },
    ]);
    const remaining = result.elements[0];

    expect(remaining?.type).toBe("connector");
    if (remaining?.type !== "connector") throw new Error("invalid result");
    expect(remaining.source_attachment).toBeUndefined();
    expect(remaining.points[0]).toEqual({ x: 110, y: 40 });
  });

  it("rejects a stale board revision", () => {
    expect(() => applyBoardOperations(board(), 2, [])).toThrow(
      RevisionConflictError,
    );
  });
});
