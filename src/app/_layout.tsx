import "../global.css";

import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { Stack } from "expo-router";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/cloud/client";
import { leaveAccount, prepareAccount, refreshAccount } from "@/lib/cloud/sync";
import { useAuthStore } from "@/store/auth";
import { useSyncStore } from "@/store/sync";

export default function RootLayout() {
  const ready = useAuthStore((state) => state.ready);
  const userId = useAuthStore((state) => state.userId);
  const syncStatus = useSyncStore((state) => state.status);

  useEffect(() => {
    if (!supabase) {
      useAuthStore.getState().setAccount(null);
      return;
    }

    let disposed = false;
    let authEventReceived = false;
    let version = 0;
    let transition: Promise<void> = Promise.resolve();
    const moveToSession = (session: Session | null) => {
      const nextVersion = ++version;
      transition = transition
        .then(async () => {
          if (disposed || nextVersion !== version) return;
          const nextUserId = session?.user.id ?? null;
          const current = useAuthStore.getState();
          if (current.ready && current.userId === nextUserId) return;
          current.setLoading();
          if (nextUserId) await prepareAccount(nextUserId);
          else await leaveAccount();
          if (disposed || nextVersion !== version) return;
          useAuthStore.getState().setAccount(nextUserId, session?.user.email ?? null);
        })
        .catch((cause: unknown) => {
          if (disposed || nextVersion !== version) return;
          useAuthStore.getState().setError(
            cause instanceof Error ? cause.message : "Could not prepare this account.",
          );
        });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventReceived = true;
      // Supabase recommends scheduling follow-up work outside the auth callback.
      setTimeout(() => moveToSession(session), 0);
    });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (authEventReceived || disposed) return;
      if (error) {
        useAuthStore.getState().setError(error.message);
        return;
      }
      moveToSession(data.session);
    });

    return () => {
      disposed = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    const refresh = () => void refreshAccount(userId).catch(() => undefined);
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    if (Platform.OS === "web") window.addEventListener("focus", refresh);
    return () => {
      appStateSubscription.remove();
      if (Platform.OS === "web") window.removeEventListener("focus", refresh);
    };
  }, [userId]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!ready || !userId}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="register" />
      </Stack.Protected>
      <Stack.Protected guard={ready && Boolean(userId) && syncStatus !== "conflict"}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={ready && Boolean(userId) && syncStatus === "conflict"}>
        <Stack.Screen name="sync-conflict" />
      </Stack.Protected>
    </Stack>
  );
}
