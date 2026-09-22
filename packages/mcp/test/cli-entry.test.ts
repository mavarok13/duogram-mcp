import { execFileSync } from "node:child_process";
import { mkdtemp, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, it } from "vitest";

it("starts the CLI through a linked installation directory", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "duogram-cli-link-"));
  try {
    const dist = fileURLToPath(new URL("../dist", import.meta.url));
    const linked = path.join(directory, "linked");
    await symlink(
      dist,
      linked,
      process.platform === "win32" ? "junction" : "dir",
    );
    const output = execFileSync(
      process.execPath,
      [path.join(linked, "cli.js"), "--help"],
      {
        encoding: "utf8",
        timeout: 10_000,
      },
    );
    expect(output).toContain("duogram init");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
