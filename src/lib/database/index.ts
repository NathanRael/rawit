import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

import { migrateDatabase } from "./migrations";

const LEGACY_DATABASE_NAME = "rawit.db";

type BusinessMutationObserver = {
  before: () => Promise<void>;
  after: () => void;
  failed: () => void;
};

let activeAccountId: string | null = null;
let mutationObserver: BusinessMutationObserver | null = null;
let suppressMutationTracking = false;

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

function databaseName(): string {
  return activeAccountId ? `rawit_${activeAccountId}.db` : LEGACY_DATABASE_NAME;
}

export function getActiveAccountId(): string | null {
  return activeAccountId;
}

export async function activateAccount(accountId: string | null): Promise<void> {
  if (accountId === activeAccountId) return;
  const previous = databasePromise;
  databasePromise = null;
  mutationObserver = null;
  if (previous) {
    const database = await previous;
    await database.closeAsync();
  }
  activeAccountId = accountId;
}

export function setBusinessMutationObserver(observer: BusinessMutationObserver | null): void {
  mutationObserver = observer;
}

export async function withoutBusinessMutationTracking<T>(task: () => Promise<T>): Promise<T> {
  const previous = suppressMutationTracking;
  suppressMutationTracking = true;
  try {
    return await task();
  } finally {
    suppressMutationTracking = previous;
  }
}

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (databasePromise) return databasePromise;

  databasePromise = (async () => {
    const database = await openDatabaseAsync(databaseName());
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
  const observer = suppressMutationTracking ? null : mutationObserver;
  await observer?.before();
  const results: { value: T }[] = [];
  try {
    await database.withTransactionAsync(async () => {
      results.push({ value: await task(database) });
    });
  } catch (error) {
    observer?.failed();
    throw databaseError(operation, error);
  }
  const [result] = results;
  if (result === undefined) {
    observer?.failed();
    throw new DatabaseError(operation, "Transaction did not complete.");
  }
  observer?.after();
  return result.value;
}

export function databaseError(operation: string, error: unknown): DatabaseError {
  return error instanceof DatabaseError ? error : new DatabaseError(operation, error);
}
