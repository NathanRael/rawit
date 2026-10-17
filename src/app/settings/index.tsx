import { useCallback, useState } from "react";
import { ActivityIndicator, Switch, View } from "react-native";
import { useFocusEffect } from "expo-router";

import { AppScreenFrame } from "@/components/AppScreenFrame";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FilterChip } from "@/components/FilterChip";
import { ThemedText } from "@/components/ThemedText";
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

export default function SettingsScreen() {
  const [preferences, setPreferences] = useState<ReminderPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
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

  return (
    <AppScreenFrame
      subtitle="Manage expiration reminder preferences."
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
