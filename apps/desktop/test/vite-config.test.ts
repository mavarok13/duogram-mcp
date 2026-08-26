import { describe, expect, it } from "vitest";

import config from "../vite.config.js";

describe("desktop Vite configuration", () => {
  it("uses relative asset paths for Electron file URLs", () => {
    expect(config).toMatchObject({ base: "./" });
  });
});
