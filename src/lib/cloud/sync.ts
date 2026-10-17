import AsyncStorage from "@react-native-async-storage/async-storage";

import { buildBackupData } from "@/lib/backup/export";
import { restoreBackup, validateBackupContent } from "@/lib/backup/import";
import type { BackupData } from "@/lib/backup/schema";
import {
  activateAccount,
  getActiveAccountId,
  getDatabase,
  initializeDatabase,
  setBusinessMutationObserver,
  withoutBusinessMutationTracking,
} from "@/lib/database";
import { reconcileAllReminders } from "@/lib/notifications/reminders";
import { cancelScheduledNotifications } from "@/lib/notifications/service";
import { useSyncStore } from "@/store/sync";

import { requireSupabase } from "./client";

type SyncMetadata = { revision: number; dirty: boolean };
type RemoteSnapshot = { revision: number; payload: BackupData };

const LEGACY_IMPORT_OWNER_KEY = "@rawit:legacy-import-owner";
let pendingSync: Promise<void> = Promise.resolve();
let syncBarrier: Promise<void> = Promise.resolve();
let activeMutations = 0;
let mutationIdleResolvers: (() => void)[] = [];

function finishMutation(): void {
  activeMutations -= 1;
  if (activeMutations === 0) {
    const resolvers = mutationIdleResolvers;
    mutationIdleResolvers = [];
    resolvers.forEach((resolve) => resolve());
  }
}

function waitForMutations(): Promise<void> {
  if (activeMutations === 0) return Promise.resolve();
  return new Promise((resolve) => mutationIdleResolvers.push(resolve));
}

async function withSyncLock<T>(task: () => Promise<T>): Promise<T> {
  const previous = syncBarrier;
  let release: () => void = () => {};
  syncBarrier = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try {
    await waitForMutations();
    return await task();
  } finally {
    release();
  }
}

export class SyncConflictError extends Error {
  constructor() {
    super("This device and the cloud both have changes. Choose which copy to keep.");
    this.name = "SyncConflictError";
  }
}

function metadataKey(userId: string): string {
  return `@rawit:sync:${userId}`;
}

function hasBusinessRecords(data: BackupData): boolean {
  const records = data.records;
  return Boolean(
    records.wifiNetworks.length ||
      records.subscribers.length ||
      records.subscriptionPeriods.length ||
      records.payments.length,
  );
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[], label: string): T[] {
  const merged = [...current];
  const byId = new Map(current.map((record) => [record.id, record]));
  for (const record of incoming) {
    const existing = byId.get(record.id);
    if (existing) {
      if (JSON.stringify(existing) !== JSON.stringify(record)) {
        throw new Error(`An earlier ${label} has the same ID as a different cloud record. No records were imported.`);
      }
      continue;
    }
    merged.push(record);
  }
  return merged;
}

function mergeBackupData(current: BackupData, earlier: BackupData): BackupData {
  return {
    version: current.version,
    exportedAt: new Date().toISOString(),
    records: {
      wifiNetworks: mergeById(current.records.wifiNetworks, earlier.records.wifiNetworks, "WiFi network"),
      subscribers: mergeById(current.records.subscribers, earlier.records.subscribers, "subscriber"),
      subscriptionPeriods: mergeById(current.records.subscriptionPeriods, earlier.records.subscriptionPeriods, "period"),
      payments: mergeById(current.records.payments, earlier.records.payments, "payment"),
    },
  };
}

async function loadMetadata(userId: string): Promise<SyncMetadata> {
  const stored = await AsyncStorage.getItem(metadataKey(userId));
  if (!stored) return { revision: 0, dirty: false };
  const value: unknown = JSON.parse(stored);
  if (
    typeof value !== "object" ||
    value === null ||
    !("revision" in value) ||
    !("dirty" in value) ||
    !Number.isSafeInteger(value.revision) ||
    (value.revision as number) < 0 ||
    typeof value.dirty !== "boolean"
  ) {
    throw new Error("Local sync state is invalid. Your device records were left untouched.");
  }
  return { revision: value.revision as number, dirty: value.dirty };
}

async function saveMetadata(userId: string, metadata: SyncMetadata): Promise<void> {
  await AsyncStorage.setItem(metadataKey(userId), JSON.stringify(metadata));
}

async function readRemoteSnapshot(userId: string): Promise<RemoteSnapshot | null> {
  const { data, error } = await requireSupabase()
    .from("rawit_snapshots")
    .select("revision,payload")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`Could not load cloud records: ${error.message}`);
  if (!data) return null;
  if (!Number.isSafeInteger(data.revision) || data.revision < 1) {
    throw new Error("Cloud revision is invalid. Local records were left untouched.");
  }
  const validated = await validateBackupContent(data.payload);
  if (!validated.valid || !validated.data) {
    throw new Error(validated.error ?? "Cloud records are invalid. Local records were left untouched.");
  }
  return { revision: data.revision, payload: validated.data };
}

function assertActiveAccount(userId: string): void {
  if (getActiveAccountId() !== userId) throw new Error("Account changed during cloud sync.");
}

async function saveRemoteSnapshot(userId: string, expectedRevision: number, payload: BackupData): Promise<number> {
  assertActiveAccount(userId);
  const { data, error } = await requireSupabase().rpc("save_rawit_snapshot", {
    expected_user_id: userId,
    expected_revision: expectedRevision,
    next_payload: payload,
  });
  if (error) {
    if (error.message.includes("RAWIT_SYNC_CONFLICT")) throw new SyncConflictError();
    throw new Error(`Could not save cloud records: ${error.message}`);
  }
  if (!Number.isSafeInteger(data) || data < 1) {
    throw new Error("Cloud save returned an invalid revision.");
  }
  return data as number;
}

async function applyRemoteSnapshot(userId: string, remote: RemoteSnapshot): Promise<void> {
  assertActiveAccount(userId);
  const database = await getDatabase();
  const oldReminders = await database.getAllAsync<{ notification_id: string }>(
    "SELECT notification_id FROM subscription_reminders",
  );
  await withoutBusinessMutationTracking(async () => {
    const result = await restoreBackup(remote.payload, { reconcileReminders: false });
    if (!result.restored) throw new Error(result.error ?? "Could not load cloud records on this device.");
  });
  await cancelScheduledNotifications(oldReminders.map((row) => row.notification_id)).catch(() => undefined);
  await reconcileAllReminders().catch(() => undefined);
  await saveMetadata(userId, { revision: remote.revision, dirty: false });
  useSyncStore.getState().markDataReplaced();
}

async function maybeImportLegacyRecords(userId: string): Promise<boolean> {
  if (await AsyncStorage.getItem(LEGACY_IMPORT_OWNER_KEY)) return false;
  const current = await buildBackupData();
  const currentReminders = await (await getDatabase()).getAllAsync<{ notification_id: string }>(
    "SELECT notification_id FROM subscription_reminders",
  );

  await activateAccount(null);
  let legacy: BackupData;
  let legacyReminderIds: string[] = [];
  try {
    await initializeDatabase();
    legacy = await buildBackupData();
    legacyReminderIds = (await (await getDatabase()).getAllAsync<{ notification_id: string }>(
      "SELECT notification_id FROM subscription_reminders",
    )).map((row) => row.notification_id);
  } finally {
    await activateAccount(userId);
    await initializeDatabase();
  }
  if (!hasBusinessRecords(legacy)) return false;

  const merged = mergeBackupData(current, legacy);
  const validated = await validateBackupContent(merged);
  if (!validated.valid || !validated.data) {
    throw new Error(validated.error ?? "Earlier records could not be imported safely.");
  }
  const metadata = await loadMetadata(userId);
  await saveMetadata(userId, { ...metadata, dirty: true });

  await withoutBusinessMutationTracking(async () => {
    const result = await restoreBackup(validated.data!, { reconcileReminders: false });
    if (!result.restored) throw new Error(result.error ?? "Could not import earlier device records.");
  });
  await cancelScheduledNotifications([
    ...currentReminders.map((row) => row.notification_id),
    ...legacyReminderIds,
  ]).catch(() => undefined);
  await reconcileAllReminders().catch(() => undefined);
  useSyncStore.getState().markDataReplaced();
  await AsyncStorage.setItem(LEGACY_IMPORT_OWNER_KEY, userId);
  return true;
}

async function synchronize(userId: string, remote?: RemoteSnapshot | null): Promise<void> {
  if (getActiveAccountId() !== userId) return;
  return withSyncLock(async () => {
    useSyncStore.getState().setStatus("syncing");
    try {
      assertActiveAccount(userId);
      const cloud = remote === undefined ? await readRemoteSnapshot(userId) : remote;
      assertActiveAccount(userId);
      const metadata = await loadMetadata(userId);

      if (!cloud) {
        if (metadata.revision > 0) throw new SyncConflictError();
        const revision = await saveRemoteSnapshot(userId, 0, await buildBackupData());
        await saveMetadata(userId, { revision, dirty: false });
      } else if (metadata.dirty) {
        if (metadata.revision !== cloud.revision) throw new SyncConflictError();
        const revision = await saveRemoteSnapshot(userId, cloud.revision, await buildBackupData());
        await saveMetadata(userId, { revision, dirty: false });
      } else if (metadata.revision !== cloud.revision) {
        await applyRemoteSnapshot(userId, cloud);
      }
      useSyncStore.getState().setStatus("idle");
    } catch (error) {
      if (error instanceof SyncConflictError) {
        useSyncStore.getState().setStatus("conflict", error.message);
      } else {
        const message = error instanceof Error ? error.message : "Cloud sync is unavailable.";
        useSyncStore.getState().setStatus("offline", message);
      }
      throw error;
    }
  });
}

function enqueue(task: () => Promise<void>): Promise<void> {
  const next = pendingSync.then(task, task);
  pendingSync = next.catch(() => undefined);
  return next;
}

export async function prepareAccount(userId: string): Promise<void> {
  await pendingSync;
  await waitForMutations();
  if (getActiveAccountId() && getActiveAccountId() !== userId) {
    await suspendAccountReminders();
  }
  setBusinessMutationObserver(null);
  await activateAccount(userId);
  await initializeDatabase();
  try {
    const remote = await readRemoteSnapshot(userId);
    await synchronize(userId, remote);
    if (await maybeImportLegacyRecords(userId)) await synchronize(userId);
  } catch (error) {
    const metadata = await loadMetadata(userId);
    if (metadata.revision === 0 && !hasBusinessRecords(await buildBackupData())) throw error;
    if (error instanceof SyncConflictError) {
      useSyncStore.getState().setStatus("conflict", error.message);
    } else {
      useSyncStore.getState().setStatus(
        "offline",
        error instanceof Error ? error.message : "Cloud sync is unavailable.",
      );
    }
  }
  setBusinessMutationObserver({
    before: async () => {
      await syncBarrier;
      if (getActiveAccountId() !== userId) throw new Error("Account changed during a database update.");
      activeMutations += 1;
      try {
        const metadata = await loadMetadata(userId);
        await saveMetadata(userId, { ...metadata, dirty: true });
      } catch (error) {
        finishMutation();
        throw error;
      }
    },
    after: () => {
      finishMutation();
      void enqueue(() => synchronize(userId)).catch(() => undefined);
    },
    failed: () => {
      finishMutation();
      void enqueue(() => synchronize(userId)).catch(() => undefined);
    },
  });
  void reconcileAllReminders().catch(() => undefined);
}

export function refreshAccount(userId: string): Promise<void> {
  return enqueue(() => synchronize(userId));
}

export async function resolveSyncConflict(userId: string, choice: "cloud" | "device"): Promise<void> {
  await enqueue(() => withSyncLock(async () => {
    if (getActiveAccountId() !== userId) throw new Error("Account changed during conflict resolution.");
    try {
      useSyncStore.getState().setStatus("syncing");
      const remote = await readRemoteSnapshot(userId);
      if (choice === "cloud") {
        if (!remote) throw new Error("There is no cloud copy to load.");
        await applyRemoteSnapshot(userId, remote);
      } else {
        const revision = await saveRemoteSnapshot(userId, remote?.revision ?? 0, await buildBackupData());
        await saveMetadata(userId, { revision, dirty: false });
      }
      useSyncStore.getState().setStatus("idle");
    } catch (cause) {
      useSyncStore.getState().setStatus(
        "conflict",
        cause instanceof Error ? cause.message : "Could not resolve the sync conflict.",
      );
      throw cause;
    }
  }));
}

export async function leaveAccount(): Promise<void> {
  await pendingSync;
  await waitForMutations();
  await suspendAccountReminders().catch(() => undefined);
  setBusinessMutationObserver(null);
  await activateAccount(null);
  useSyncStore.getState().setStatus("idle");
}

export async function suspendAccountReminders(): Promise<void> {
  if (!getActiveAccountId()) return;
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ notification_id: string }>(
    "SELECT notification_id FROM subscription_reminders",
  );
  if (rows.length === 0) return;
  await cancelScheduledNotifications(rows.map((row) => row.notification_id));
  await database.runAsync("DELETE FROM subscription_reminders");
}
