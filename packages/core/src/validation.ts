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
  assertSchema(validateBoardSchema, migrated, "board");
  assertBoardInvariants(migrated);
  return migrated;
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
