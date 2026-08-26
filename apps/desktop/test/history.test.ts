import { describe, expect, it } from "vitest";

import {
  commitHistory,
  createHistory,
  redoHistory,
  undoHistory,
} from "../src/renderer/history.js";

describe("session history", () => {
  it("records commits and traverses undo and redo", () => {
    const initial = createHistory("first");
    const committed = commitHistory(initial, "second");
    const undone = undoHistory(committed);
    const redone = redoHistory(undone);

    expect(committed).toEqual({
      past: ["first"],
      present: "second",
      future: [],
    });
    expect(undone.present).toBe("first");
    expect(redone.present).toBe("second");
  });

  it("clears redo entries when a new edit is committed", () => {
    const history = undoHistory(
      commitHistory(createHistory("first"), "second"),
    );

    expect(commitHistory(history, "branch").future).toEqual([]);
  });
});
