import {
  DuogramValidationError,
  RevisionConflictError,
  StorageLockError,
} from "@duogram/core";

import type { DesktopError, DesktopResult } from "../shared/api.js";

export async function desktopResult<T>(
  operation: () => Promise<T>,
): Promise<DesktopResult<T>> {
  try {
    return { ok: true, value: await operation() };
  } catch (error) {
    return { ok: false, error: toDesktopError(error) };
  }
}

export function toDesktopError(error: unknown): DesktopError {
  if (error instanceof RevisionConflictError) {
    return { code: "CONFLICT", message: error.message };
  }
  if (error instanceof DuogramValidationError) {
    return {
      code: "VALIDATION",
      message: error.message,
      issues: error.issues,
    };
  }
  if (error instanceof StorageLockError) {
    return { code: "LOCKED", message: error.message };
  }
  if (error instanceof Error) {
    if (error.message === "no Duogram project is open") {
      return { code: "NO_PROJECT", message: error.message };
    }
    if ("code" in error && typeof error.code === "string") {
      return { code: "IO", message: error.message };
    }
    return { code: "UNKNOWN", message: error.message };
  }
  return { code: "UNKNOWN", message: String(error) };
}
