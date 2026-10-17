import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import {
  listPaymentsForSubscription,
  listSubscribers,
  listSubscriptionPeriods,
  listWifiNetworks,
} from "@/lib/database/repositories";

import { BACKUP_VERSION, type BackupData, type BackupExportResult } from "./schema";

function backupFileName(date = new Date()): string {
  const iso = date.toISOString().slice(0, 10);
  return `rawit-backup-${iso}.json`;
}

async function readAllPayments(): Promise<BackupData["records"]["payments"]> {
  const periods = await listSubscriptionPeriods();
  const payments: BackupData["records"]["payments"] = [];
  for (const period of periods) {
    const periodPayments = await listPaymentsForSubscription(period.id);
    payments.push(...periodPayments);
  }
  return payments;
}

export async function buildBackupData(): Promise<BackupData> {
  const [wifiNetworks, subscribers, subscriptionPeriods, payments] = await Promise.all([
    listWifiNetworks(),
    listSubscribers(),
    listSubscriptionPeriods(),
    readAllPayments(),
  ]);

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    records: {
      wifiNetworks,
      subscribers,
      subscriptionPeriods,
      payments,
    },
  };
}

export async function exportBackup(): Promise<BackupExportResult> {
  try {
    const backup = await buildBackupData();
    const json = JSON.stringify(backup, null, 2);
    const fileName = backupFileName();

    if (Platform.OS === "web") {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      return { exported: true, shared: true, filePath: undefined };
    }

    const file = new File(Paths.cache, fileName);
    file.write(json);

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/json",
        dialogTitle: "Save RAWIT backup",
      });
    }

    try {
      file.delete();
    } catch {
      // Cleanup failure should not mark export as failed.
    }

    return { exported: true, shared: isAvailable, filePath: file.uri };
  } catch (cause) {
    return {
      exported: false,
      error: cause instanceof Error ? cause.message : "Could not create backup.",
    };
  }
}
