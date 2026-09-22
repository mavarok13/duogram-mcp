#!/usr/bin/env node

import path from "node:path";
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { initializeProject } from "./initialize.js";
import { runStdioServer } from "./server.js";

const HELP = `Usage:
  duogram init [directory] [--name <name>]
  duogram mcp [--project <directory>]
`;

export async function runCli(args: readonly string[]): Promise<void> {
  const [command, ...rest] = args;
  if (command === "init") {
    const directory = positional(rest) ?? ".";
    const name = option(rest, "--name");
    const result = await initializeProject(directory, name);
    process.stdout.write(
      `Initialized Duogram project "${result.project.name}" in ${path.resolve(directory)}\n`,
    );
    return;
  }
  if (command === "mcp") {
    const projectDirectory = option(rest, "--project") ?? ".";
    await runStdioServer(path.resolve(projectDirectory));
    return;
  }
  if (command === "--help" || command === "-h" || command === undefined) {
    process.stdout.write(HELP);
    return;
  }
  throw new Error(`unknown command: ${command}\n${HELP}`);
}

function option(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`missing value for ${name}`);
  }
  return value;
}

function positional(args: readonly string[]): string | undefined {
  return args.find((argument, index) => {
    if (argument.startsWith("--")) return false;
    return index === 0 || !args[index - 1]?.startsWith("--");
  });
}

const isEntryPoint =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;

if (isEntryPoint) {
  runCli(process.argv.slice(2)).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
