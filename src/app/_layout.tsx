import "../global.css";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Text, View } from "react-native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack, usePathname, useRouter, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { initializeDatabase } from "@/lib/database";
import { reconcileAllReminders, refreshRemindersOnLifecycleChange } from "@/lib/notifications/reminders";
import { refreshLifecycleDate } from "@/store/lifecycle";
import { AppNavigationBar, type TabNavigationDirection } from "@/components/AppNavigationBar";

type PendingTabTransition = {
  id: number;
  href: Href;
  pathname: string;
  direction: TabNavigationDirection | undefined;
};

function normalizePathname(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

function refreshAppClockAndReminders(): void {
  refreshLifecycleDate();
  void refreshRemindersOnLifecycleChange();
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [pendingTabTransition, setPendingTabTransition] = useState<PendingTabTransition | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const nextTabTransitionId = useRef(0);
  const dispatchedTabTransitionId = useRef(0);

  const navigateToTab = useCallback(
    (href: Href, targetPathname: string, direction: TabNavigationDirection | undefined) => {
      if (normalizePathname(pathname) === targetPathname) {
        setPendingTabTransition(null);
        return;
      }

      setPendingTabTransition({
        id: ++nextTabTransitionId.current,
        href,
        pathname: targetPathname,
        direction,
      });
    },
    [pathname],
  );

  useLayoutEffect(() => {
    if (!pendingTabTransition || dispatchedTabTransitionId.current === pendingTabTransition.id) return;

    // The Stack options have committed with this direction before replacing the route.
    dispatchedTabTransitionId.current = pendingTabTransition.id;
    router.replace(pendingTabTransition.href);
  }, [pendingTabTransition, router]);

  useEffect(() => {
    if (pendingTabTransition?.pathname !== normalizePathname(pathname)) return;

    const transitionId = pendingTabTransition.id;
    const resetFrame = requestAnimationFrame(() => {
      setPendingTabTransition((current) => (current?.id === transitionId ? null : current));
    });
    return () => cancelAnimationFrame(resetFrame);
  }, [pathname, pendingTabTransition]);

  useEffect(() => {
    refreshAppClockAndReminders();
    void initializeDatabase()
      .then(async () => {
        await reconcileAllReminders();
        setIsReady(true);
      })
      .catch((error: unknown) => {
        setStartupError(error instanceof Error ? error.message : "Unknown local storage error.");
      });

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshAppClockAndReminders();
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <StatusBar style="dark" />
        <View className="flex-1 bg-canvas">
          <Stack
            screenOptions={{
              headerShown: false,
              animationTypeForReplace: pendingTabTransition?.direction,
            }}
          />
          <AppNavigationBar onNavigate={navigateToTab} />
        </View>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
