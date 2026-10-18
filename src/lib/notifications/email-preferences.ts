import { requireSupabase } from "@/lib/cloud/client";
import type { ReminderPreferences } from "@/types";

export async function loadEmailReminderPreferences(userId: string): Promise<{
  emailEnabled: boolean;
  sharedPreferences: ReminderPreferences | null;
  timeZone: string | null;
}> {
  const { data, error } = await requireSupabase().from("rawit_email_preferences")
    .select("email_enabled, reminders_enabled, intervals_days, time_zone")
    .eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return {
    emailEnabled: data?.email_enabled ?? false,
    timeZone: data?.time_zone ?? null,
    sharedPreferences: data?.email_enabled ? {
      enabled: data.reminders_enabled,
      intervalsDays: data.intervals_days,
    } : null,
  };
}

export async function saveEmailReminderPreferences(
  userId: string,
  emailEnabled: boolean,
  preferences: ReminderPreferences,
): Promise<void> {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const { error } = await requireSupabase().from("rawit_email_preferences").upsert({
    user_id: userId,
    email_enabled: emailEnabled,
    reminders_enabled: preferences.enabled,
    intervals_days: preferences.intervalsDays,
    time_zone: timeZone,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) throw error;
}
