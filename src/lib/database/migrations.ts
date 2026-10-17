import type { SQLiteDatabase } from "expo-sqlite";

export const DATABASE_VERSION = 1;

async function migrateToVersionOne(database: SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE wifi_networks (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL CHECK (length(trim(name)) > 0),
      ssid TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE subscribers (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL CHECK (length(trim(name)) > 0),
      phone TEXT,
      email TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE subscription_periods (
      id TEXT PRIMARY KEY NOT NULL,
      subscriber_id TEXT NOT NULL REFERENCES subscribers(id) ON DELETE RESTRICT,
      wifi_network_id TEXT NOT NULL REFERENCES wifi_networks(id) ON DELETE RESTRICT,
      start_date TEXT NOT NULL,
      duration_value INTEGER NOT NULL CHECK (duration_value > 0),
      duration_unit TEXT NOT NULL CHECK (duration_unit IN ('day', 'week', 'month')),
      amount REAL NOT NULL CHECK (amount >= 0),
      cancelled_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX subscription_periods_subscriber_id_idx
      ON subscription_periods(subscriber_id);
    CREATE INDEX subscription_periods_wifi_network_id_idx
      ON subscription_periods(wifi_network_id);
    CREATE INDEX subscription_periods_start_date_idx
      ON subscription_periods(start_date);

    CREATE TABLE payments (
      id TEXT PRIMARY KEY NOT NULL,
      subscription_id TEXT NOT NULL REFERENCES subscription_periods(id) ON DELETE RESTRICT,
      amount REAL NOT NULL CHECK (amount > 0),
      paid_at TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX payments_subscription_id_idx ON payments(subscription_id);

    CREATE TABLE subscription_reminders (
      id TEXT PRIMARY KEY NOT NULL,
      subscription_id TEXT NOT NULL REFERENCES subscription_periods(id) ON DELETE CASCADE,
      trigger_date TEXT NOT NULL,
      notification_id TEXT NOT NULL UNIQUE,
      UNIQUE (subscription_id, trigger_date)
    );
  `);
}

export async function migrateDatabase(database: SQLiteDatabase): Promise<void> {
  const versionRow = await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const currentVersion = versionRow?.user_version ?? 0;
  if (currentVersion > DATABASE_VERSION) {
    throw new Error(
      `Database version ${currentVersion} is newer than the supported version ${DATABASE_VERSION}.`,
    );
  }
  if (currentVersion === DATABASE_VERSION) return;

  await database.withTransactionAsync(async () => {
    let version = currentVersion;
    if (version < 1) {
      await migrateToVersionOne(database);
      version = 1;
      await database.execAsync("PRAGMA user_version = 1");
    }
    if (version !== DATABASE_VERSION) {
      throw new Error(`No migration is available from database version ${version}.`);
    }
  });
}
