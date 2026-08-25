import { describe, expect, it } from "vitest";

import { MigrationError, migrateVersioned } from "../src/index.js";

describe("migrations", () => {
  it("applies every migration in sequence", () => {
    const result = migrateVersioned(
      "test",
      { schema_version: 1, value: "old" },
      3,
      new Map([
        [1, (value) => ({ ...value, schema_version: 2, middle: true })],
        [2, (value) => ({ ...value, schema_version: 3, value: "new" })],
      ]),
    );

    expect(result).toEqual({
      schema_version: 3,
      value: "new",
      middle: true,
    });
  });

  it("fails when a sequential migration is absent", () => {
    expect(() =>
      migrateVersioned("test", { schema_version: 1 }, 2, new Map()),
    ).toThrow(MigrationError);
  });
});
