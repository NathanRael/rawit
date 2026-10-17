import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Switch, View } from "react-native";
import { useFocusEffect } from "expo-router";

import { AppScreenFrame } from "@/components/AppScreenFrame";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FilterChip } from "@/components/FilterChip";
import { ThemedText } from "@/components/ThemedText";
import {
  buildBackupData,
  exportBackup,
  pickBackupFile,
  restoreBackup,
  type BackupData,
  type BackupRestoreResult,
} from "@/lib/backup";
import {
  DEFAULT_REMINDER_INTERVALS_DAYS,
  loadReminderPreferences,
  reconcileAllReminders,
  requestNotificationPermissions,
  resetReminderPreferences,
  saveReminderPreferences,
} from "@/lib/notifications";
import type { ReminderPreferences } from "@/types";

const PRESET_INTERVALS = [
  { label: "3 days before", value: 3 },
  { label: "2 days before", value: 2 },
  { label: "1 day before", value: 1 },
  { label: "On expiration day", value: 0 },
];

type BackupPreview = {
  exportedAt: string;
  wifiNetworks: number;
  subscribers: number;
  subscriptionPeriods: number;
  payments: number;
};

export default function SettingsScreen() {
  const [preferences, setPreferences] = useState<ReminderPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [backupPreview, setBackupPreview] = useState<BackupPreview | null>(null);
  const [pendingRestore, setPendingRestore] = useState<BackupData | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const [restoreResult, setRestoreResult] = useState<BackupRestoreResult | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loaded = await loadReminderPreferences();
      setPreferences(loaded);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load settings.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadBackupPreview = useCallback(async () => {
    try {
      const data = await buildBackupData();
      setBackupPreview({
        exportedAt: data.exportedAt,
        wifiNetworks: data.records.wifiNetworks.length,
        subscribers: data.records.subscribers.length,
        subscriptionPeriods: data.records.subscriptionPeriods.length,
        payments: data.records.payments.length,
      });
    } catch {
      setBackupPreview(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
      void loadBackupPreview();
    }, [load, loadBackupPreview]),
  );

  const toggleEnabled = async (enabled: boolean) => {
    if (!preferences) return;
    const next = { ...preferences, enabled };
    setPreferences(next);
    try {
      await saveReminderPreferences(next);
      if (enabled) {
        void requestNotificationPermissions().then(async (granted) => {
          if (granted) await reconcileAllReminders();
        });
      } else {
        await reconcileAllReminders();
      }
      showSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save reminder settings.");
    }
  };

  const toggleInterval = async (days: number) => {
    if (!preferences) return;
    const nextIntervals = preferences.intervalsDays.includes(days)
      ? preferences.intervalsDays.filter((d) => d !== days)
      : [...preferences.intervalsDays, days];
    const next = { ...preferences, intervalsDays: nextIntervals };
    setPreferences(next);
    try {
      await saveReminderPreferences(next);
      await reconcileAllReminders();
      showSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save reminder settings.");
    }
  };

  const handleReset = async () => {
    try {
      const reset = await resetReminderPreferences();
      setPreferences(reset);
      await reconcileAllReminders();
      showSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not reset reminder settings.");
    }
  };

  const showSaved = () => {
    setSaveMessage("Reminder settings saved");
    setTimeout(() => setSaveMessage(null), 2000);
  };

  const handleExport = async () => {
    setBackupBusy(true);
    setError(null);
    setRestoreResult(null);
    try {
      const result = await exportBackup();
      if (!result.exported) {
        setError(result.error ?? "Backup could not be created.");
      } else {
        await loadBackupPreview();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Backup could not be created.");
    } finally {
      setBackupBusy(false);
    }
  };

  const handlePickBackup = async () => {
    setBackupBusy(true);
    setError(null);
    setRestoreResult(null);
    setPendingRestore(null);
    try {
      const result = await pickBackupFile();
      if (!result.valid || !result.data) {
        setError(result.error ?? "Backup file is invalid.");
        return;
      }
      setPendingRestore(result.data);
      Alert.alert(
        "Restore backup?",
        `This will replace all current records with the backup from ${new Date(result.data.exportedAt).toLocaleString()}. This action cannot be undone.`,
        [
          { text: "Cancel", style: "cancel", onPress: () => setPendingRestore(null) },
          { text: "Restore", style: "destructive", onPress: () => void confirmRestore(result.data!) },
        ],
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not read backup file.");
    } finally {
      setBackupBusy(false);
    }
  };

  const confirmRestore = async (data: BackupData) => {
    setBackupBusy(true);
    setError(null);
    setRestoreResult(null);
    try {
      const result = await restoreBackup(data);
      setRestoreResult(result);
      if (!result.restored) {
        setError(result.error ?? "Restore failed.");
      } else {
        await loadBackupPreview();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Restore failed.");
    } finally {
      setBackupBusy(false);
      setPendingRestore(null);
    }
  };

  return (
    <AppScreenFrame
      subtitle="Manage reminders, backups, and restore."
      title="Settings"
    >
      {isLoading ? (
        <View className="items-center gap-3 py-8">
          <ActivityIndicator accessibilityLabel="Loading settings" />
          <ThemedText accessibilityLiveRegion="polite">Loading settings…</ThemedText>
        </View>
      ) : error ? (
        <Card className="gap-4">
          <ThemedText accessibilityRole="alert">Settings could not be loaded.</ThemedText>
          <ThemedText>{error}</ThemedText>
          <Button onPress={() => void load()} title="Try again" variant="secondary" />
        </Card>
      ) : preferences ? (
        <View className="gap-5">
          <Card className="gap-4">
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1 gap-1">
                <ThemedText variant="heading">Expiration reminders</ThemedText>
                <ThemedText>Notify before subscription periods expire.</ThemedText>
              </View>
              <Switch
                accessibilityLabel="Enable expiration reminders"
                accessibilityRole="switch"
                accessibilityState={{ checked: preferences.enabled }}
                onValueChange={toggleEnabled}
                value={preferences.enabled}
              />
            </View>

            {preferences.enabled ? (
              <View className="gap-3">
                <ThemedText variant="label">Reminder intervals</ThemedText>
                <View className="flex-row flex-wrap gap-2">
                  {PRESET_INTERVALS.map((interval) => (
                    <FilterChip
                      key={interval.value}
                      label={interval.label}
                      onPress={() => void toggleInterval(interval.value)}
                      selected={preferences.intervalsDays.includes(interval.value)}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </Card>

          <Card className="gap-3">
            <ThemedText variant="heading">Defaults</ThemedText>
            <ThemedText>
              Default intervals are{" "}
              {DEFAULT_REMINDER_INTERVALS_DAYS.map((d) => (d === 0 ? "expiration day" : `${d} day${d === 1 ? "" : "s"} before`)).join(", ")}
              .
            </ThemedText>
            <Button onPress={() => void handleReset()} title="Reset to defaults" variant="secondary" />
          </Card>

          <Card className="gap-4">
            <ThemedText variant="heading">Backup & restore</ThemedText>
            {backupPreview ? (
              <View className="gap-1">
                <ThemedText variant="label">Current records</ThemedText>
                <ThemedText>
                  {backupPreview.wifiNetworks} network{backupPreview.wifiNetworks === 1 ? "" : "s"}, {" "}
                  {backupPreview.subscribers} subscriber{backupPreview.subscribers === 1 ? "" : "s"}, {" "}
                  {backupPreview.subscriptionPeriods} period{backupPreview.subscriptionPeriods === 1 ? "" : "s"}, {" "}
                  {backupPreview.payments} payment{backupPreview.payments === 1 ? "" : "s"}
                </ThemedText>
              </View>
            ) : null}
            <View className="gap-2">
              <Button
                disabled={backupBusy}
                loading={backupBusy && !pendingRestore}
                onPress={() => void handleExport()}
                title="Export backup"
                accessibilityHint="Share a portable backup file of all business records"
              />
              <Button
                disabled={backupBusy}
                loading={backupBusy && !pendingRestore}
                onPress={() => void handlePickBackup()}
                title="Restore from backup"
                variant="secondary"
                accessibilityHint="Select a backup file to replace current records"
              />
            </View>
            {restoreResult?.restored ? (
              <ThemedText accessibilityLiveRegion="polite" variant="caption">
                Restore complete: {restoreResult.importedCounts.wifiNetworks} networks,{" "}
                {restoreResult.importedCounts.subscribers} subscribers,{" "}
                {restoreResult.importedCounts.subscriptionPeriods} periods,{" "}
                {restoreResult.importedCounts.payments} payments.
              </ThemedText>
            ) : null}
          </Card>

          {saveMessage ? (
            <ThemedText accessibilityLiveRegion="polite" className="text-center" variant="caption">
              {saveMessage}
            </ThemedText>
          ) : null}
        </View>
      ) : null}
    </AppScreenFrame>
  );
}
