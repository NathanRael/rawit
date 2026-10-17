import { useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppPageHeader } from "@/components/AppPageHeader";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { exportBackup } from "@/lib/backup";
import { resolveSyncConflict } from "@/lib/cloud/sync";
import { useAuthStore } from "@/store/auth";
import { spacing } from "@/theme";

type Choice = "cloud" | "device";

export default function SyncConflictScreen() {
  const userId = useAuthStore((state) => state.userId);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolve = async () => {
    if (!userId || !choice) return;
    setBusy(true);
    setError(null);
    try {
      await resolveSyncConflict(userId, choice);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not resolve the sync conflict.");
    } finally {
      setBusy(false);
    }
  };

  const saveDeviceBackup = async () => {
    setBusy(true);
    const result = await exportBackup();
    if (!result.exported) setError(result.error ?? "Could not export the device copy.");
    setBusy(false);
  };

  return (
    <SafeAreaView className="flex-1 items-center bg-canvas" edges={["top", "bottom", "left", "right"]}>
      <ScrollView
        className="w-full"
        contentContainerStyle={{ alignSelf: "center", gap: spacing.xl, maxWidth: Platform.OS === "web" ? 430 : undefined, padding: spacing.md, width: "100%" }}
      >
        <AppPageHeader />
        <View className="gap-2 pt-4">
          <ThemedText variant="title">Choose which records to keep</ThemedText>
          <ThemedText>This device and your cloud account changed separately. Select one copy to continue syncing.</ThemedText>
        </View>
        <Card className="gap-4">
          <Button disabled={busy} onPress={() => void saveDeviceBackup()} title="Export this device first" variant="secondary" />
          {choice ? (
            <>
              <ThemedText accessibilityRole="alert">
                {choice === "cloud"
                  ? "Using the cloud copy will replace this device's unsynced records."
                  : "Using this device will replace newer cloud records on your other devices."}
              </ThemedText>
              <Button loading={busy} onPress={() => void resolve()} title={choice === "cloud" ? "Confirm cloud copy" : "Confirm device copy"} variant="danger" />
              <Button disabled={busy} onPress={() => setChoice(null)} title="Back" variant="secondary" />
            </>
          ) : (
            <>
              <Button disabled={busy} onPress={() => setChoice("cloud")} title="Use cloud copy" />
              <Button disabled={busy} onPress={() => setChoice("device")} title="Use this device copy" variant="secondary" />
            </>
          )}
          {error ? <ThemedText accessibilityRole="alert">{error}</ThemedText> : null}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
