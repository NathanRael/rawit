import { File } from "expo-file-system";

import { withDatabaseTransaction } from "@/lib/database";
import { reconcileAllReminders } from "@/lib/notifications/reminders";

import {
  backupSchema,
  type BackupData,
  type BackupRestoreResult,
  type BackupValidationResult,
} from "./schema";

function validateRelationships(data: BackupData): string | null {
  const networkIds = new Set(data.records.wifiNetworks.map((n) => n.id));
  const subscriberIds = new Set(data.records.subscribers.map((s) => s.id));
  const periodIds = new Set(data.records.subscriptionPeriods.map((p) => p.id));

  for (const period of data.records.subscriptionPeriods) {
    if (!subscriberIds.has(period.subscriberId)) {
      return `Subscription period ${period.id} references missing subscriber ${period.subscriberId}.`;
    }
    if (!networkIds.has(period.wifiNetworkId)) {
      return `Subscription period ${period.id} references missing WiFi network ${period.wifiNetworkId}.`;
    }
  }

  for (const payment of data.records.payments) {
    if (!periodIds.has(payment.subscriptionId)) {
      return `Payment ${payment.id} references missing subscription period ${payment.subscriptionId}.`;
    }
  }

  return null;
}

function validateUniqueIds(data: BackupData): string | null {
  const tables: { name: string; ids: string[] }[] = [
    { name: "wifiNetworks", ids: data.records.wifiNetworks.map((n) => n.id) },
    { name: "subscribers", ids: data.records.subscribers.map((s) => s.id) },
    { name: "subscriptionPeriods", ids: data.records.subscriptionPeriods.map((p) => p.id) },
    { name: "payments", ids: data.records.payments.map((p) => p.id) },
  ];

  for (const table of tables) {
    const seen = new Set<string>();
    for (const id of table.ids) {
      if (seen.has(id)) return `Duplicate ${table.name} id: ${id}.`;
      seen.add(id);
    }
  }

  return null;
}

export async function validateBackupContent(content: unknown): Promise<BackupValidationResult> {
  const parseResult = await backupSchema.safeParseAsync(content);
  if (!parseResult.success) {
    const issues = parseResult.error.issues.map((issue) => issue.message).join("; ");
    return { valid: false, error: `Invalid backup format: ${issues}` };
  }

  const data = parseResult.data;
  const relationshipError = validateRelationships(data);
  if (relationshipError) return { valid: false, error: relationshipError };

  const uniqueError = validateUniqueIds(data);
  if (uniqueError) return { valid: false, error: uniqueError };

  return { valid: true, data };
}

export async function readBackupFile(uri: string): Promise<BackupValidationResult> {
  try {
    const file = new File(uri);
    const content = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return { valid: false, error: "Backup file is not valid JSON." };
    }
    return validateBackupContent(parsed);
  } catch (cause) {
    return {
      valid: false,
      error: cause instanceof Error ? cause.message : "Could not read backup file.",
    };
  }
}

export async function pickBackupFile(): Promise<BackupValidationResult> {
  try {
    const result = await File.pickFileAsync({ mimeTypes: ["application/json"] });

    if (result.canceled || result.result === null) {
      return { valid: false, error: "Backup selection was cancelled." };
    }

    const selected = Array.isArray(result.result) ? result.result[0] : result.result;
    if (!selected) {
      return { valid: false, error: "No backup file was selected." };
    }

    return readBackupFile(selected.uri);
  } catch (cause) {
    return {
      valid: false,
      error: cause instanceof Error ? cause.message : "Could not open the file picker.",
    };
  }
}

export async function restoreBackup(data: BackupData): Promise<BackupRestoreResult> {
  const importedCounts = {
    wifiNetworks: 0,
    subscribers: 0,
    subscriptionPeriods: 0,
    payments: 0,
  };

  try {
    await withDatabaseTransaction("Restore backup", async (database) => {
      await database.runAsync("DELETE FROM payments");
      await database.runAsync("DELETE FROM subscription_reminders");
      await database.runAsync("DELETE FROM subscription_periods");
      await database.runAsync("DELETE FROM subscribers");
      await database.runAsync("DELETE FROM wifi_networks");

      for (const network of data.records.wifiNetworks) {
        await database.runAsync(
          "INSERT INTO wifi_networks (id, name, ssid, notes, created_at) VALUES (?, ?, ?, ?, ?)",
          [network.id, network.name, network.ssid, network.notes, network.createdAt],
        );
        importedCounts.wifiNetworks += 1;
      }

      for (const subscriber of data.records.subscribers) {
        await database.runAsync(
          "INSERT INTO subscribers (id, name, phone, email, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)",
          [subscriber.id, subscriber.name, subscriber.phone, subscriber.email, subscriber.notes, subscriber.createdAt],
        );
        importedCounts.subscribers += 1;
      }

      for (const period of data.records.subscriptionPeriods) {
        await database.runAsync(
          `INSERT INTO subscription_periods
            (id, subscriber_id, wifi_network_id, start_date, duration_value, duration_unit, amount, cancelled_at, notes, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            period.id,
            period.subscriberId,
            period.wifiNetworkId,
            period.startDate,
            period.durationValue,
            period.durationUnit,
            period.amount,
            period.cancelledAt,
            period.notes,
            period.createdAt,
          ],
        );
        importedCounts.subscriptionPeriods += 1;
      }

      for (const payment of data.records.payments) {
        await database.runAsync(
          "INSERT INTO payments (id, subscription_id, amount, paid_at, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)",
          [payment.id, payment.subscriptionId, payment.amount, payment.paidAt, payment.notes, payment.createdAt],
        );
        importedCounts.payments += 1;
      }
    });

    void reconcileAllReminders().catch(() => {
      // Reminder reconciliation failure must not mark restore as failed.
    });

    return { restored: true, importedCounts };
  } catch (cause) {
    return {
      restored: false,
      error: cause instanceof Error ? cause.message : "Could not restore backup.",
      importedCounts,
    };
  }
}
