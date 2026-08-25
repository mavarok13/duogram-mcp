import { describe, expect, it } from "vitest";

import { applyProjectOperations } from "../src/index.js";
import { IDs, project } from "./fixtures.js";

describe("project operations", () => {
  it("manages spaces and board summaries as an immutable batch", () => {
    const original = project();
    const result = applyProjectOperations(original, 0, [
      {
        type: "add_space",
        space: { id: IDs.other, name: "Other", boards: [] },
      },
      {
        type: "rename_board",
        board_id: IDs.board,
        name: "Renamed",
      },
      {
        type: "move_board",
        board_id: IDs.board,
        target_space_id: IDs.other,
      },
    ]);

    expect(result.revision).toBe(1);
    expect(result.spaces[1]?.boards).toEqual([
      { id: IDs.board, name: "Renamed" },
    ]);
    expect(original.spaces[0]?.boards[0]?.name).toBe("Backend");
  });

  it("does not delete a non-empty space", () => {
    expect(() =>
      applyProjectOperations(project(), 0, [
        { type: "delete_space", space_id: IDs.space },
      ]),
    ).toThrow(/space is not empty/);
  });
});
