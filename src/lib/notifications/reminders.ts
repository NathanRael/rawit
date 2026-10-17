import { getDatabase } from "@/lib/database";
import { calculateExpirationDate, getLocalDate } from "@/lib/dates";
import type { LocalDate, SubscriptionPeriodDetails } from "@/types";

import { loadReminderPreferences } from "./preferences";
import {
  cancelScheduledNotifications,
  getExpirationReminderInput,
  scheduleExpirationReminder,
} from "./service";

interface ReminderRow {
  id: string;
  subscription_id: string;
  trigger_date: string;
  notification_id: string;
}

function computeTriggerDate(expirationDate: LocalDate, daysBeforeExpiration: number): LocalDate {
  const [year, month, day] = expirationDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - daysBeforeExpiration);
  return getLocalDate(date);
}

export async function listStoredReminderRows(subscriptionId: string): Promise<ReminderRow[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<ReminderRow>(
    "SELECT id, subscription_id, trigger_date, notification_id FROM subscription_reminders WHERE subscription_id = ?",
    [subscriptionId],
  );
  return rows;
}

export async function cancelRemindersForSubscription(subscriptionId: string): Promise<void> {
  const rows = await listStoredReminderRows(subscriptionId);
  if (rows.length === 0) return;
  await cancelScheduledNotifications(rows.map((row) => row.notification_id));
  const database = await getDatabase();
  await database.runAsync("DELETE FROM subscription_reminders WHERE subscription_id = ?", [subscriptionId]);
}

function shouldScheduleRemindersFor(period: SubscriptionPeriodDetails): boolean {
  return period.lifecycleStatus === "active" || period.lifecycleStatus === "expiring_soon";
}

export async function reconcileRemindersForSubscription(subscriptionId: string): Promise<void> {
  const [preferences, period] = await Promise.all([
    loadReminderPreferences(),
    (async () => {
      const { getSubscriptionPeriodById } = await import("@/lib/database/repositories");
      return getSubscriptionPeriodById(subscriptionId);
    })(),
  ]);

  if (!preferences.enabled || !period || !shouldScheduleRemindersFor(period)) {
    await cancelRemindersForSubscription(subscriptionId);
    return;
  }

  const expirationDate = calculateExpirationDate(period.startDate, period.durationValue, period.durationUnit);
  const asOfDate = getLocalDate();
  const desiredTriggerDates = new Set<LocalDate>();
  const daysBeforeByTriggerDate = new Map<LocalDate, number>();

  for (const daysBefore of preferences.intervalsDays) {
    const triggerDate = computeTriggerDate(expirationDate, daysBefore);
    if (triggerDate >= asOfDate) {
      desiredTriggerDates.add(triggerDate);
      daysBeforeByTriggerDate.set(triggerDate, daysBefore);
    }
  }

  const storedRows = await listStoredReminderRows(subscriptionId);
  const storedTriggerDates = new Set(storedRows.map((row) => row.trigger_date));

  const obsoleteRows = storedRows.filter((row) => !desiredTriggerDates.has(row.trigger_date));
  const missingTriggerDates = [...desiredTriggerDates].filter((date) => !storedTriggerDates.has(date));

  if (obsoleteRows.length > 0) {
    await cancelScheduledNotifications(obsoleteRows.map((row) => row.notification_id));
    const ids = obsoleteRows.map((row) => row.id);
    const placeholders = ids.map(() => "?").join(",");
    await getDatabase().then((database) =>
      database.runAsync(`DELETE FROM subscription_reminders WHERE id IN (${placeholders})`, ids),
    );
  }

  const scheduled: { triggerDate: LocalDate; notificationId: string }[] = [];
  for (const triggerDate of missingTriggerDates) {
    const daysBefore = daysBeforeByTriggerDate.get(triggerDate);
    if (daysBefore === undefined) continue;
    const input = getExpirationReminderInput(period, daysBefore);
    const notificationId = await scheduleExpirationReminder(input);
    if (notificationId) {
      scheduled.push({ triggerDate, notificationId });
    }
  }

  if (scheduled.length > 0) {
    const database = await getDatabase();
    await database.withTransactionAsync(async () => {
      for (const { triggerDate, notificationId } of scheduled) {
        const reminderId = `rem_${subscriptionId}_${triggerDate}`;
        await database.runAsync(
          "INSERT OR IGNORE INTO subscription_reminders (id, subscription_id, trigger_date, notification_id) VALUES (?, ?, ?, ?)",
          [reminderId, subscriptionId, triggerDate, notificationId],
        );
      }
    });
  }
}

export async function reconcileAllReminders(): Promise<void> {
  const preferences = await loadReminderPreferences();
  const database = await getDatabase();

  const storedRows = await database.getAllAsync<ReminderRow>(
    "SELECT id, subscription_id, trigger_date, notification_id FROM subscription_reminders",
  );

  if (!preferences.enabled) {
    if (storedRows.length > 0) {
      await cancelScheduledNotifications(storedRows.map((row) => row.notification_id));
      await database.runAsync("DELETE FROM subscription_reminders");
    }
    return;
  }

  const { listSubscriptionPeriods } = await import("@/lib/database/repositories");
  const periods = await listSubscriptionPeriods();
  const activePeriods = periods.filter(shouldScheduleRemindersFor);
  const activeIds = new Set(activePeriods.map((period) => period.id));

  const obsoleteRows = storedRows.filter((row) => !activeIds.has(row.subscription_id));
  if (obsoleteRows.length > 0) {
    await cancelScheduledNotifications(obsoleteRows.map((row) => row.notification_id));
    const ids = obsoleteRows.map((row) => row.id);
    const placeholders = ids.map(() => "?").join(",");
    await database.runAsync(`DELETE FROM subscription_reminders WHERE id IN (${placeholders})`, ids);
  }

  await Promise.all(activePeriods.map((period) => reconcileRemindersForSubscription(period.id)));
}

export async function refreshRemindersOnLifecycleChange(): Promise<void> {
  const database = await getDatabase();
  const storedRows = await database.getAllAsync<ReminderRow>(
    "SELECT id, subscription_id, trigger_date, notification_id FROM subscription_reminders",
  );
  if (storedRows.length === 0) return;

  const { listSubscriptionPeriods } = await import("@/lib/database/repositories");
  const periods = await listSubscriptionPeriods();
  const periodById = new Map(periods.map((p) => [p.id, p]));

  const obsoleteRows = storedRows.filter((row) => {
    const period = periodById.get(row.subscription_id);
    if (!period) return true;
    return !shouldScheduleRemindersFor(period);
  });

  if (obsoleteRows.length > 0) {
    await cancelScheduledNotifications(obsoleteRows.map((row) => row.notification_id));
    const ids = obsoleteRows.map((row) => row.id);
    const placeholders = ids.map(() => "?").join(",");
    await database.runAsync(`DELETE FROM subscription_reminders WHERE id IN (${placeholders})`, ids);
  }
}
