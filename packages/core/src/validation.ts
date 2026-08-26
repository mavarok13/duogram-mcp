import {
  Ajv2020,
  type ErrorObject,
  type ValidateFunction,
} from "ajv/dist/2020.js";

import { DuogramValidationError } from "./errors.js";
import {
  assertBoardInvariants,
  assertProjectInvariants,
} from "./invariants.js";
import { migrateVersioned } from "./migrations.js";
import { boardSchemaV1, projectSchemaV1 } from "./schemas.js";
import type { BoardV1, ProjectV1 } from "./types.js";

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateBoardSchema: ValidateFunction<BoardV1> =
  ajv.compile(boardSchemaV1);
const validateProjectSchema: ValidateFunction<ProjectV1> =
  ajv.compile(projectSchemaV1);

export function parseBoardJson(json: string): BoardV1 {
  return validateBoard(parseJson(json, "board"));
}

export function parseProjectJson(json: string): ProjectV1 {
  return validateProject(parseJson(json, "project"));
}

export function validateBoard(value: unknown): BoardV1 {
  const migrated = migrateVersioned("board", value, 1, new Map());
  const normalized = normalizeLegacyBoard(migrated);
  assertSchema(validateBoardSchema, normalized, "board");
  assertBoardInvariants(normalized);
  return normalized;
}

export function validateProject(value: unknown): ProjectV1 {
  const migrated = migrateVersioned("project", value, 1, new Map());
  assertSchema(validateProjectSchema, migrated, "project");
  assertProjectInvariants(migrated);
  return migrated;
}

function parseJson(json: string, kind: string): unknown {
  try {
    return JSON.parse(json) as unknown;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new DuogramValidationError(`invalid ${kind} JSON: ${detail}`);
  }
}

function normalizeLegacyBoard(value: unknown): unknown {
  if (!isRecord(value) || !Array.isArray(value["elements"])) return value;
  const board = structuredClone(value);
  const elements = board["elements"];
  if (!Array.isArray(elements)) return board;
  for (const element of elements) {
    if (!isRecord(element)) continue;
    const type = element["type"];
    if (type !== "shape" && type !== "text") continue;
    const style = element["text_style"];
    if (isRecord(style) && style["font_family"] === undefined) {
      style["font_family"] = "Roboto";
    }
  }
  return board;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertSchema<T>(
  validate: ValidateFunction<T>,
  value: unknown,
  kind: string,
): asserts value is T {
  if (!validate(value)) {
    throw new DuogramValidationError(
      `invalid ${kind}`,
      (validate.errors ?? []).map(formatAjvError),
    );
  }
}

function formatAjvError(error: ErrorObject): string {
  return `${error.instancePath || "/"} ${error.message ?? "is invalid"}`;
}
