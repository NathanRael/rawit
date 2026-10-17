import type { LocalDate, NewPayment, Payment, UpdatePayment } from "@/types";
import { parseLocalDate } from "@/lib/dates";

import { createRecordId, nowIso, optionalText } from "./helpers";
import { databaseError, getDatabase, withDatabaseTransaction } from "./index";

interface PaymentRow {
  id: string;
  subscription_id: string;
  amount: number;
  paid_at: string;
  notes: string | null;
  created_at: string;
}

function mapPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    subscriptionId: row.subscription_id,
    amount: row.amount,
    paidAt: parseLocalDate(row.paid_at.slice(0, 10)),
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function validatePayment(input: Pick<NewPayment, "amount" | "paidAt">): LocalDate {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new RangeError("Payment amount must be greater than zero.");
  }
  return parseLocalDate(input.paidAt);
}

export async function createPayment(input: NewPayment): Promise<Payment> {
  if (!input.subscriptionId.trim()) throw new RangeError("A subscription period is required.");
  const paidAt = validatePayment(input);
  const id = createRecordId("payment");
  const createdAt = nowIso();
  const notes = optionalText(input.notes);
  return withDatabaseTransaction("Create payment", async (database) => {
    await database.runAsync(
      "INSERT INTO payments (id, subscription_id, amount, paid_at, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [id, input.subscriptionId, input.amount, paidAt, notes, createdAt],
    );
    return { id, subscriptionId: input.subscriptionId, amount: input.amount, paidAt, notes, createdAt };
  });
}

export async function updatePayment(id: string, input: UpdatePayment): Promise<Payment | null> {
  const paidAt = validatePayment(input);
  return withDatabaseTransaction("Update payment", async (database) => {
    const result = await database.runAsync(
      "UPDATE payments SET amount = ?, paid_at = ?, notes = ? WHERE id = ?",
      [input.amount, paidAt, optionalText(input.notes), id],
    );
    if (result.changes === 0) return null;
    const row = await database.getFirstAsync<PaymentRow>(
      "SELECT id, subscription_id, amount, paid_at, notes, created_at FROM payments WHERE id = ?",
      [id],
    );
    return row ? mapPayment(row) : null;
  });
}

export async function deletePayment(id: string): Promise<boolean> {
  return withDatabaseTransaction("Delete payment", async (database) => {
    const result = await database.runAsync("DELETE FROM payments WHERE id = ?", [id]);
    return result.changes > 0;
  });
}

export async function listPaymentsForSubscription(subscriptionId: string): Promise<Payment[]> {
  try {
    const database = await getDatabase();
    const rows = await database.getAllAsync<PaymentRow>(
      `SELECT id, subscription_id, amount, paid_at, notes, created_at
       FROM payments WHERE subscription_id = ? ORDER BY paid_at, created_at`,
      [subscriptionId],
    );
    return rows.map(mapPayment);
  } catch (error) {
    throw databaseError("List subscription payments", error);
  }
}
