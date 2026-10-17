import type {
  DurationUnit,
  LocalDate,
  NewSubscriptionPeriod,
  SubscriberSubscriptionPeriod,
  SubscriptionLifecycleStatus,
  SubscriptionPeriodDetails,
  SubscriptionPeriod,
} from "@/types";
import {
  calculateExpirationDate,
  getLocalDate,
  getPaymentStatus,
  getSubscriptionLifecycleStatus,
  parseLocalDate,
} from "@/lib/dates";

import { createRecordId, nowIso, optionalText } from "./helpers";
import { databaseError, getDatabase, withDatabaseTransaction } from "./index";

interface SubscriptionPeriodRow {
  id: string;
  subscriber_id: string;
  wifi_network_id: string;
  start_date: string;
  duration_value: number;
  duration_unit: string;
  amount: number;
  cancelled_at: string | null;
  notes: string | null;
  created_at: string;
  amount_paid: number;
  payment_count: number;
  subscriber_name: string;
  wifi_network_name: string;
}

type SubscriberSubscriptionPeriodRow = SubscriptionPeriodRow;

function parseDurationUnit(value: string): DurationUnit {
  if (value === "day" || value === "week" || value === "month") return value;
  throw new Error(`Stored subscription duration unit is invalid: ${value}`);
}

function mapSubscriptionPeriod(row: SubscriptionPeriodRow, asOfDate: LocalDate): SubscriptionPeriod {
  const durationUnit = parseDurationUnit(row.duration_unit);
  const expirationDate = calculateExpirationDate(
    parseLocalDate(row.start_date),
    row.duration_value,
    durationUnit,
  );
  const amountPaid = row.amount_paid;
  return {
    id: row.id,
    subscriberId: row.subscriber_id,
    wifiNetworkId: row.wifi_network_id,
    startDate: row.start_date,
    durationValue: row.duration_value,
    durationUnit,
    amount: row.amount,
    cancelledAt: row.cancelled_at,
    notes: row.notes,
    createdAt: row.created_at,
    expirationDate,
    lifecycleStatus: getSubscriptionLifecycleStatus(
      expirationDate,
      row.cancelled_at,
      asOfDate,
    ),
    amountPaid,
    paymentCount: row.payment_count,
    paymentStatus: getPaymentStatus(row.amount, amountPaid),
  };
}

function mapSubscriptionPeriodDetails(
  row: SubscriptionPeriodRow,
  asOfDate: LocalDate,
): SubscriptionPeriodDetails {
  return {
    ...mapSubscriptionPeriod(row, asOfDate),
    subscriberName: row.subscriber_name,
    wifiNetworkName: row.wifi_network_name,
  };
}

function validatePeriod(input: NewSubscriptionPeriod): void {
  if (!input.subscriberId.trim() || !input.wifiNetworkId.trim()) {
    throw new RangeError("A subscriber and WiFi network are required.");
  }
  parseLocalDate(input.startDate);
  if (!Number.isInteger(input.durationValue) || input.durationValue <= 0) {
    throw new RangeError("Duration must be a positive whole number.");
  }
  if (input.durationUnit !== "day" && input.durationUnit !== "week" && input.durationUnit !== "month") {
    throw new RangeError("Duration unit must be day, week, or month.");
  }
  calculateExpirationDate(input.startDate, input.durationValue, input.durationUnit);
  if (!Number.isFinite(input.amount) || input.amount < 0) {
    throw new RangeError("Amount must be a non-negative number.");
  }
}

const SUBSCRIPTION_SELECT = `
  SELECT
    s.id, s.subscriber_id, s.wifi_network_id, s.start_date,
    s.duration_value, s.duration_unit, s.amount, s.cancelled_at,
    s.notes, s.created_at, COALESCE(SUM(p.amount), 0) AS amount_paid,
    COUNT(p.id) AS payment_count, sub.name AS subscriber_name,
    n.name AS wifi_network_name
  FROM subscription_periods s
  LEFT JOIN payments p ON p.subscription_id = s.id
  INNER JOIN subscribers sub ON sub.id = s.subscriber_id
  INNER JOIN wifi_networks n ON n.id = s.wifi_network_id`;

export async function createSubscriptionPeriod(
  input: NewSubscriptionPeriod,
): Promise<SubscriptionPeriod> {
  validatePeriod(input);
  const id = createRecordId("period");
  const createdAt = nowIso();
  return withDatabaseTransaction("Create subscription period", async (database) => {
    await database.runAsync(
      `INSERT INTO subscription_periods
        (id, subscriber_id, wifi_network_id, start_date, duration_value, duration_unit, amount, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.subscriberId,
        input.wifiNetworkId,
        input.startDate,
        input.durationValue,
        input.durationUnit,
        input.amount,
        optionalText(input.notes),
        createdAt,
      ],
    );
    const row = await database.getFirstAsync<SubscriptionPeriodRow>(
      `${SUBSCRIPTION_SELECT} WHERE s.id = ? GROUP BY s.id`,
      [id],
    );
    if (!row) throw new Error("Inserted subscription period could not be read.");
    return mapSubscriptionPeriod(row, getLocalDate());
  });
}

export async function updateSubscriptionPeriod(
  id: string,
  input: NewSubscriptionPeriod,
): Promise<SubscriptionPeriod | null> {
  validatePeriod(input);
  return withDatabaseTransaction("Update subscription period", async (database) => {
    const result = await database.runAsync(
      `UPDATE subscription_periods
       SET subscriber_id = ?, wifi_network_id = ?, start_date = ?, duration_value = ?,
           duration_unit = ?, amount = ?, notes = ?
       WHERE id = ?`,
      [
        input.subscriberId,
        input.wifiNetworkId,
        input.startDate,
        input.durationValue,
        input.durationUnit,
        input.amount,
        optionalText(input.notes),
        id,
      ],
    );
    if (result.changes === 0) return null;
    const row = await database.getFirstAsync<SubscriptionPeriodRow>(
      `${SUBSCRIPTION_SELECT} WHERE s.id = ? GROUP BY s.id`,
      [id],
    );
    return row ? mapSubscriptionPeriod(row, getLocalDate()) : null;
  });
}

export async function cancelSubscriptionPeriod(id: string): Promise<boolean> {
  try {
    const database = await getDatabase();
    const result = await database.runAsync(
      "UPDATE subscription_periods SET cancelled_at = ? WHERE id = ? AND cancelled_at IS NULL",
      [nowIso(), id],
    );
    return result.changes > 0;
  } catch (error) {
    throw databaseError("Cancel subscription period", error);
  }
}

export async function getSubscriptionPeriodById(
  id: string,
  asOfDate: LocalDate = getLocalDate(),
): Promise<SubscriptionPeriodDetails | null> {
  try {
    const database = await getDatabase();
    const row = await database.getFirstAsync<SubscriptionPeriodRow>(
      `${SUBSCRIPTION_SELECT} WHERE s.id = ? GROUP BY s.id`,
      [id],
    );
    return row ? mapSubscriptionPeriodDetails(row, asOfDate) : null;
  } catch (error) {
    throw databaseError("Read subscription period", error);
  }
}

export async function listSubscriptionPeriods(options?: {
  asOfDate?: LocalDate;
  lifecycleStatus?: SubscriptionLifecycleStatus;
  unpaidOnly?: boolean;
}): Promise<SubscriptionPeriodDetails[]> {
  const asOfDate = options?.asOfDate ?? getLocalDate();
  try {
    const database = await getDatabase();
    const rows = await database.getAllAsync<SubscriptionPeriodRow>(
      `${SUBSCRIPTION_SELECT} GROUP BY s.id ORDER BY s.start_date DESC, s.created_at DESC`,
    );
    return rows
      .map((row) => mapSubscriptionPeriodDetails(row, asOfDate))
      .filter((period) =>
        options?.lifecycleStatus ? period.lifecycleStatus === options.lifecycleStatus : true,
      )
      .filter((period) => (options?.unpaidOnly ? period.paymentStatus !== "paid" : true));
  } catch (error) {
    throw databaseError("List subscription periods", error);
  }
}

export async function listSubscriberSubscriptionPeriods(
  subscriberId: string,
  asOfDate: LocalDate = getLocalDate(),
): Promise<SubscriberSubscriptionPeriod[]> {
  try {
    const database = await getDatabase();
    const rows = await database.getAllAsync<SubscriberSubscriptionPeriodRow>(
      `${SUBSCRIPTION_SELECT}
       WHERE s.subscriber_id = ?
       GROUP BY s.id
       ORDER BY s.start_date DESC, s.created_at DESC`,
      [subscriberId],
    );
    return rows.map((row) => ({
      ...mapSubscriptionPeriod(row, asOfDate),
      wifiNetworkName: row.wifi_network_name,
    }));
  } catch (error) {
    throw databaseError("List subscriber subscription periods", error);
  }
}

export type SubscriptionPeriodDeletionResult =
  | { deleted: true }
  | { deleted: false; reason: "not_found" }
  | { deleted: false; reason: "has_payments"; paymentCount: number };

export async function deleteSubscriptionPeriod(
  id: string,
): Promise<SubscriptionPeriodDeletionResult> {
  return withDatabaseTransaction("Delete subscription period", async (database) => {
    const row = await database.getFirstAsync<{ payment_count: number }>(
      "SELECT COUNT(*) AS payment_count FROM payments WHERE subscription_id = ?",
      [id],
    );
    if (!row) return { deleted: false, reason: "not_found" };
    if (row.payment_count > 0) {
      return { deleted: false, reason: "has_payments", paymentCount: row.payment_count };
    }

    const result = await database.runAsync("DELETE FROM subscription_periods WHERE id = ?", [id]);
    return result.changes > 0
      ? { deleted: true }
      : { deleted: false, reason: "not_found" };
  });
}
