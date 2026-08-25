import { MigrationError, UnsupportedSchemaVersionError } from "./errors.js";

export type Migration = (
  value: Record<string, unknown>,
) => Record<string, unknown>;

export function migrateVersioned(
  kind: string,
  value: unknown,
  currentVersion: number,
  migrations: ReadonlyMap<number, Migration>,
): unknown {
  if (!isRecord(value) || !Number.isInteger(value["schema_version"])) {
    throw new MigrationError(
      `${kind} does not contain an integer schema_version`,
    );
  }

  const sourceVersion = value["schema_version"] as number;
  if (sourceVersion > currentVersion) {
    throw new UnsupportedSchemaVersionError(
      kind,
      sourceVersion,
      currentVersion,
    );
  }

  let migrated = value;
  for (let version = sourceVersion; version < currentVersion; version += 1) {
    const migration = migrations.get(version);
    if (migration === undefined) {
      throw new MigrationError(
        `missing ${kind} migration from version ${String(version)} to ${String(version + 1)}`,
      );
    }
    migrated = migration(migrated);
    if (migrated["schema_version"] !== version + 1) {
      throw new MigrationError(
        `${kind} migration from version ${String(version)} did not produce version ${String(version + 1)}`,
      );
    }
  }
  return migrated;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
