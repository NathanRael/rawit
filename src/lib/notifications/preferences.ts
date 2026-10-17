import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ReminderPreferences } from "@/types";

const REMINDER_PREFERENCES_KEY = "@rawit:reminder-preferences";

export const DEFAULT_REMINDER_INTERVALS_DAYS: number[] = [3, 1, 0];

export const DEFAULT_REMINDER_PREFERENCES: ReminderPreferences = {
  enabled: true,
  intervalsDays: [...DEFAULT_REMINDER_INTERVALS_DAYS],
};

function isNonNegativeIntegerArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => Number.isInteger(item) && item >= 0);
}

function normalizeIntervals(intervals: number[]): number[] {
  return [...new Set(intervals)].sort((a, b) => a - b);
}

export function validateReminderPreferences(input: unknown): ReminderPreferences {
  if (typeof input !== "object" || input === null) {
    return { ...DEFAULT_REMINDER_PREFERENCES };
  }

  const candidate = input as Partial<ReminderPreferences>;
  const enabled = typeof candidate.enabled === "boolean" ? candidate.enabled : DEFAULT_REMINDER_PREFERENCES.enabled;
  const rawIntervals = isNonNegativeIntegerArray(candidate.intervalsDays)
    ? candidate.intervalsDays
    : DEFAULT_REMINDER_PREFERENCES.intervalsDays;

  return {
    enabled,
    intervalsDays: normalizeIntervals(rawIntervals),
  };
}

export async function loadReminderPreferences(): Promise<ReminderPreferences> {
  try {
    const stored = await AsyncStorage.getItem(REMINDER_PREFERENCES_KEY);
    if (stored === null) return { ...DEFAULT_REMINDER_PREFERENCES };
    return validateReminderPreferences(JSON.parse(stored));
  } catch {
    return { ...DEFAULT_REMINDER_PREFERENCES };
  }
}

export async function saveReminderPreferences(preferences: ReminderPreferences): Promise<void> {
  const normalized: ReminderPreferences = {
    enabled: preferences.enabled,
    intervalsDays: normalizeIntervals(preferences.intervalsDays),
  };
  await AsyncStorage.setItem(REMINDER_PREFERENCES_KEY, JSON.stringify(normalized));
}

export async function resetReminderPreferences(): Promise<ReminderPreferences> {
  await AsyncStorage.removeItem(REMINDER_PREFERENCES_KEY);
  return { ...DEFAULT_REMINDER_PREFERENCES };
}
