import "../global.css";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Text, View } from "react-native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack, usePathname, useRouter, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { initializeDatabase } from "@/lib/database";
import { reconcileAllReminders, refreshRemindersOnLifecycleChange } from "@/lib/notifications/reminders";
import { refreshLifecycleDate } from "@/store/lifecycle";
import { AppNavigationBar } from "@/components/AppNavigationBar";
import { motion } from "@/theme/motion";

type PendingTabTransition = {
  id: number;
  href: Href;
  pathname: string;
};

function normalizePathname(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

// Bottom-bar roots. Native stacks animate a replacement with the entering screen's
// animation, so these stay `none` for their whole lifetime rather than being toggled per tap.
const tabRouteNames = new Set(["index", "subscriptions", "wifi", "subscribers"]);

function stackScreenOptions({ route }: { route: { name: string } }) {
  const isTabRoute = tabRouteNames.has(route.name.replace(/\/index$/, ""));
  return isTabRoute ? { headerShown: false, animation: "none" as const } : { headerShown: false };
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
  const animatedTabTransitionId = useRef(0);

  const navigateToTab = useCallback(
    (href: Href, targetPathname: string) => {
      if (normalizePathname(pathname) === targetPathname) {
        setPendingTabTransition(null);
        return;
      }

      setPendingTabTransition({
        id: ++nextTabTransitionId.current,
        href,
        pathname: targetPathname,
      });
    },
    [pathname],
  );

  const pageOpacity = useSharedValue(1);
  const pageScale = useSharedValue(1);
  const animatedPageStyle = useAnimatedStyle(() => ({
    opacity: pageOpacity.value,
    transform: [{ scale: pageScale.value }],
  }));

  useLayoutEffect(() => {
    if (!pendingTabTransition || dispatchedTabTransitionId.current === pendingTabTransition.id) return;

    dispatchedTabTransitionId.current = pendingTabTransition.id;
    router.replace(pendingTabTransition.href);
  }, [pendingTabTransition, router]);

  useLayoutEffect(() => {
    if (
      !pendingTabTransition ||
      normalizePathname(pathname) !== pendingTabTransition.pathname ||
      animatedTabTransitionId.current === pendingTabTransition.id
    ) {
      return;
    }

    // Start from the hidden/small state immediately so the settled page never paints
    // before the entrance, then ease both values to rest.
    animatedTabTransitionId.current = pendingTabTransition.id;
    const { duration, initialOpacity, initialScale } = motion.tabPage;
    // CSS "ease" curve: gentle start and gentle settle, avoiding the abrupt snap of ease-out.
    const easing = Easing.bezier(0.25, 0.1, 0.25, 1);
    pageOpacity.set(initialOpacity);
    pageScale.set(initialScale);
    pageOpacity.set(withTiming(1, { duration, easing }));
    pageScale.set(withTiming(1, { duration, easing }));
  }, [pageOpacity, pageScale, pathname, pendingTabTransition]);

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
          <Animated.View style={[{ flex: 1 }, animatedPageStyle]}>
            <Stack screenOptions={stackScreenOptions} />
          </Animated.View>
          <AppNavigationBar onNavigate={navigateToTab} />
        </View>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
