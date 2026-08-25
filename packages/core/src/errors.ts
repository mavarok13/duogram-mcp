export class DuogramValidationError extends Error {
  readonly issues: readonly string[];

  constructor(message: string, issues: readonly string[] = []) {
    super(message);
    this.name = "DuogramValidationError";
    this.issues = issues;
  }
}

export class UnsupportedSchemaVersionError extends Error {
  readonly kind: string;
  readonly version: number;
  readonly currentVersion: number;

  constructor(kind: string, version: number, currentVersion: number) {
    super(
      `${kind} schema version ${String(version)} is newer than supported version ${String(currentVersion)}`,
    );
    this.name = "UnsupportedSchemaVersionError";
    this.kind = kind;
    this.version = version;
    this.currentVersion = currentVersion;
  }
}

export class MigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MigrationError";
  }
}

export class RevisionConflictError extends Error {
  readonly expectedRevision: number;
  readonly actualRevision: number;

  constructor(expectedRevision: number, actualRevision: number) {
    super(
      `revision conflict: expected ${String(expectedRevision)}, found ${String(actualRevision)}`,
    );
    this.name = "RevisionConflictError";
    this.expectedRevision = expectedRevision;
    this.actualRevision = actualRevision;
  }
}

export class StorageLockError extends Error {
  constructor(path: string) {
    super(`file is locked by another writer: ${path}`);
    this.name = "StorageLockError";
  }
}
