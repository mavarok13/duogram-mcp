import assert from "node:assert/strict";
import process from "node:process";
import console from "node:console";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const { version } = JSON.parse(
  await readFile(path.join(root, "package.json"), "utf8"),
);
const directory = await mkdtemp(path.join(os.tmpdir(), "duogram-install-"));
function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: directory,
    encoding: "utf8",
    timeout: 120_000,
    shell: process.platform === "win32" && command === "npm",
  });
  assert.equal(
    result.status,
    0,
    result.error?.message ?? `${result.stdout}\n${result.stderr}`,
  );
  return result.stdout;
}
try {
  await writeFile(
    path.join(directory, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  run(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      `"${path.join(root, "release", `duogram-core-${version}.tgz`)}"`,
      `"${path.join(root, "release", `duogram-mcp-${version}.tgz`)}"`,
    ].map((arg) =>
      process.platform === "win32" ? arg : arg.replaceAll('"', ""),
    ),
  );
  const cli = path.join(directory, "node_modules/@duogram/mcp/dist/cli.js");
  assert.match(run(process.execPath, [cli, "--help"]), /duogram init/);
  run(process.execPath, [
    cli,
    "init",
    "project",
    "--name",
    "Installation smoke",
  ]);
  const manifest = JSON.parse(
    await readFile(
      path.join(directory, "project/.duogram/project.json"),
      "utf8",
    ),
  );
  assert.equal(manifest.name, "Installation smoke");
  const sdk = path.join(
    directory,
    "node_modules/@modelcontextprotocol/sdk/dist/esm/client",
  );
  const { Client } = await import(pathToFileURL(path.join(sdk, "index.js")));
  const { StdioClientTransport } = await import(
    pathToFileURL(path.join(sdk, "stdio.js"))
  );
  const client = new Client({ name: "installation-smoke", version: "1.0.0" });
  try {
    await client.connect(
      new StdioClientTransport({
        command: process.execPath,
        args: [cli, "mcp", "--project", path.join(directory, "project")],
      }),
    );
    const { tools } = await client.listTools();
    assert.equal(tools.length, 10);
  } finally {
    await client.close();
  }
  console.log(
    "Clean installation, CLI initialization, and MCP handshake passed.",
  );
} finally {
  await rm(directory, { recursive: true, force: true, maxRetries: 5 });
}
