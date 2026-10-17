import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { calculateExpirationDate, formatDateLocal, getLocalDate, parseLocalDate } from "@/lib/dates";
import type { DurationUnit, LocalDate, SubscriptionPeriodDetails } from "@/types";

const REMINDER_HOUR = 9;
const REMINDER_MINUTE = 0;

function isNotificationsSupported(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

export async function getNotificationPermissions(): Promise<boolean> {
  if (!isNotificationsSupported()) return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === Notifications.PermissionStatus.GRANTED;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!isNotificationsSupported()) return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === Notifications.PermissionStatus.GRANTED;
}

export interface ExpirationReminderInput {
  subscriptionId: string;
  subscriberName: string;
  wifiNetworkName: string;
  startDate: LocalDate;
  durationValue: number;
  durationUnit: DurationUnit;
  daysBeforeExpiration: number;
}

function reminderTitle(daysBefore: number): string {
  if (daysBefore === 0) return "Subscription expires today";
  if (daysBefore === 1) return "Subscription expires tomorrow";
  return `Subscription expires in ${daysBefore} days`;
}

function reminderBody(input: ExpirationReminderInput): string {
  const expirationDate = calculateExpirationDate(
    input.startDate,
    input.durationValue,
    input.durationUnit,
  );
  const dateLabel = formatDateLocal(expirationDate);
  return `${input.subscriberName} on ${input.wifiNetworkName} expires ${dateLabel}.`;
}

function buildTriggerDate(expirationDate: LocalDate, daysBeforeExpiration: number): Date | null {
  const today = getLocalDate();
  const [year, month, day] = parseLocalDate(expirationDate).split("-").map(Number);
  const trigger = new Date(year, month - 1, day, REMINDER_HOUR, REMINDER_MINUTE, 0, 0);
  trigger.setDate(trigger.getDate() - daysBeforeExpiration);

  const triggerLocalDate = getLocalDate(trigger);
  if (triggerLocalDate < today) return null;
    if (triggerLocalDate === today) {
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), REMINDER_HOUR, REMINDER_MINUTE, 0, 0);
    if (trigger <= cutoff) return null;
  }
  return trigger;
}

export async function scheduleExpirationReminder(
  input: ExpirationReminderInput,
): Promise<string | null> {
  if (!isNotificationsSupported()) return null;

  const expirationDate = calculateExpirationDate(
    input.startDate,
    input.durationValue,
    input.durationUnit,
  );
  const triggerDate = buildTriggerDate(expirationDate, input.daysBeforeExpiration);
  if (triggerDate === null) return null;

  const granted = await getNotificationPermissions();
  if (!granted) return null;

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: reminderTitle(input.daysBeforeExpiration),
      body: reminderBody(input),
      data: {
        subscriptionId: input.subscriptionId,
        expirationDate,
        daysBeforeExpiration: input.daysBeforeExpiration,
      },
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    } as Notifications.DateTriggerInput,
  });
  return identifier;
}

export async function cancelScheduledNotifications(identifiers: string[]): Promise<void> {
  if (!isNotificationsSupported()) return;
  await Promise.all(identifiers.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

export async function getScheduledNotificationIds(): Promise<string[]> {
  if (!isNotificationsSupported()) return [];
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  return notifications.map((notification) => notification.identifier);
}

export function getExpirationReminderInput(
  period: SubscriptionPeriodDetails,
  daysBeforeExpiration: number,
): ExpirationReminderInput {
  return {
    subscriptionId: period.id,
    subscriberName: period.subscriberName,
    wifiNetworkName: period.wifiNetworkName,
    startDate: period.startDate,
    durationValue: period.durationValue,
    durationUnit: period.durationUnit,
    daysBeforeExpiration,
  };
}
