import { describe, expect, it } from "vitest";

import {
  DuogramValidationError,
  RevisionConflictError,
  StorageLockError,
} from "@duogram/core";

import { toDesktopError } from "../src/main/errors.js";

describe("desktop error mapping", () => {
  it("maps domain errors to stable renderer codes", () => {
    expect(toDesktopError(new RevisionConflictError(1, 2)).code).toBe(
      "CONFLICT",
    );
    expect(toDesktopError(new StorageLockError("board.json")).code).toBe(
      "LOCKED",
    );
    expect(
      toDesktopError(new DuogramValidationError("invalid", ["/id bad"])),
    ).toEqual({
      code: "VALIDATION",
      message: "invalid",
      issues: ["/id bad"],
    });
  });
});
