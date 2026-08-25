import { describe, expect, it } from "vitest";

import {
  DuogramValidationError,
  UnsupportedSchemaVersionError,
  parseBoardJson,
  validateBoard,
  validateProject,
} from "../src/index.js";
import { board, IDs, project } from "./fixtures.js";

describe("boundary validation", () => {
  it("preserves nested unknown agent metadata", () => {
    const result = parseBoardJson(JSON.stringify(board()));

    expect(result.elements[0]?.agent_meta).toEqual({
      nested: { score: 3, flags: [true, null, "kept"] },
    });
  });

  it("rejects unknown fields outside agent_meta", () => {
    const value: unknown = { ...board(), unexpected: true };

    expect(() => validateBoard(value)).toThrow(DuogramValidationError);
  });

  it("rejects dangling connector attachments", () => {
    const value = board();
    const connector = value.elements[1];
    if (connector?.type !== "connector") throw new Error("invalid fixture");
    connector.source_attachment = {
      element_id: IDs.other,
      anchor: { x: 0, y: 0 },
    };

    expect(() => validateBoard(value)).toThrow(/attaches to missing/);
  });

  it("rejects duplicate board IDs across spaces", () => {
    const value = project();
    value.spaces.push({
      id: IDs.other,
      name: "Duplicate",
      boards: [{ id: IDs.board, name: "Same board" }],
    });

    expect(() => validateProject(value)).toThrow(/board IDs must be unique/);
  });

  it("does not accept a future version for overwrite", () => {
    expect(() => validateBoard({ ...board(), schema_version: 2 })).toThrow(
      UnsupportedSchemaVersionError,
    );
  });
});
