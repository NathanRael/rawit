import "../global.css";

import { useEffect, useState } from "react";
import { ActivityIndicator, AppState, Text, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { initializeDatabase } from "@/lib/database";
import { refreshLifecycleDate } from "@/store/lifecycle";
import { AppNavigationBar } from "@/components/AppNavigationBar";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [startupError, setStartupError] = useState<string | null>(null);

  useEffect(() => {
    refreshLifecycleDate();
    void initializeDatabase()
      .then(() => setIsReady(true))
      .catch((error: unknown) => {
        setStartupError(error instanceof Error ? error.message : "Unknown local storage error.");
      });

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshLifecycleDate();
    });

    return () => appStateSubscription.remove();
  }, []);

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-canvas px-6">
        <StatusBar style="dark" />
        {startupError ? (
          <>
            <Text className="text-center text-lg font-semibold text-ink">
              Local data could not be initialized.
            </Text>
            <Text className="text-center text-ink">{startupError}</Text>
          </>
        ) : (
          <>
            <ActivityIndicator accessibilityLabel="Initializing local data" />
            <Text className="text-ink">Preparing local data…</Text>
          </>
        )}
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <View className="flex-1 bg-canvas">
        <Stack screenOptions={{ headerShown: false }} />
        <AppNavigationBar />
      </View>
    </>
  );
}
