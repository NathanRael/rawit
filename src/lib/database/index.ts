import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

import { migrateDatabase } from "./migrations";

const DATABASE_NAME = "rawit.db";

export class DatabaseError extends Error {
  readonly operation: string;

  constructor(operation: string, cause: unknown) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    super(`${operation}: ${detail}`);
    this.name = "DatabaseError";
    this.operation = operation;
  }
}

let databasePromise: Promise<SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (databasePromise) return databasePromise;

  databasePromise = (async () => {
    const database = await openDatabaseAsync(DATABASE_NAME);
    await database.execAsync("PRAGMA foreign_keys = ON");
    await migrateDatabase(database);
    return database;
  })().catch((error: unknown) => {
    databasePromise = null;
    throw new DatabaseError("Initialize local database", error);
  });

  return databasePromise;
}

export async function initializeDatabase(): Promise<void> {
  await getDatabase();
}

export async function withDatabaseTransaction<T>(
  operation: string,
  task: (database: SQLiteDatabase) => Promise<T>,
): Promise<T> {
  const database = await getDatabase();
  const results: { value: T }[] = [];
  try {
    await database.withTransactionAsync(async () => {
      results.push({ value: await task(database) });
    });
  } catch (error) {
    throw databaseError(operation, error);
  }
  const [result] = results;
  if (result === undefined) throw new DatabaseError(operation, "Transaction did not complete.");
  return result.value;
}

export function databaseError(operation: string, error: unknown): DatabaseError {
  return error instanceof DatabaseError ? error : new DatabaseError(operation, error);
}
