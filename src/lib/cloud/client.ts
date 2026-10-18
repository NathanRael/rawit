import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { AppState, Platform } from "react-native";

function resolveDevelopmentUrl(configuredUrl: string | undefined): string | undefined {
  if (!configuredUrl || !__DEV__ || Platform.OS === "web") return configuredUrl;

  try {
    const parsedUrl = new URL(configuredUrl);
    if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(parsedUrl.hostname)) {
      return configuredUrl;
    }

    const hostUri = Constants.expoConfig?.hostUri;
    if (!hostUri) return configuredUrl;
    const metroHost = new URL(`http://${hostUri}`).hostname;
    if (!metroHost) return configuredUrl;

    parsedUrl.hostname = metroHost;
    return parsedUrl.toString().replace(/\/$/, "");
  } catch {
    return configuredUrl;
  }
}

const url = resolveDevelopmentUrl(process.env.EXPO_PUBLIC_SUPABASE_URL);
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isCloudConfigured = Boolean(url && publishableKey);

export const supabase: SupabaseClient | null = isCloudConfigured
  ? createClient(url!, publishableKey!, {
      auth: {
        ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

if (supabase && Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error("Supabase is not configured. Add its project URL and publishable key to .env.local.");
  }
  return supabase;
}
