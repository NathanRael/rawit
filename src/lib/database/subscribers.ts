import type { NewSubscriber, Subscriber } from "@/types";

import { createRecordId, nowIso, optionalText } from "./helpers";
import { databaseError, getDatabase, withDatabaseTransaction } from "./index";

interface SubscriberRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
}

function mapSubscriber(row: SubscriberRow): Subscriber {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function validateSubscriber(input: NewSubscriber): string {
  const name = input.name.trim();
  if (!name) throw new RangeError("A subscriber name is required.");
  return name;
}

export async function createSubscriber(input: NewSubscriber): Promise<Subscriber> {
  const name = validateSubscriber(input);
  const id = createRecordId("person");
  const createdAt = nowIso();
  const phone = optionalText(input.phone);
  const email = optionalText(input.email);
  const notes = optionalText(input.notes);
  try {
    const database = await getDatabase();
    await database.runAsync(
      "INSERT INTO subscribers (id, name, phone, email, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [id, name, phone, email, notes, createdAt],
    );
    return { id, name, phone, email, notes, createdAt };
  } catch (error) {
    throw databaseError("Create subscriber", error);
  }
}

export async function updateSubscriber(
  id: string,
  input: NewSubscriber,
): Promise<Subscriber | null> {
  const name = validateSubscriber(input);
  return withDatabaseTransaction("Update subscriber", async (database) => {
    const result = await database.runAsync(
      "UPDATE subscribers SET name = ?, phone = ?, email = ?, notes = ? WHERE id = ?",
      [name, optionalText(input.phone), optionalText(input.email), optionalText(input.notes), id],
    );
    if (result.changes === 0) return null;
    const row = await database.getFirstAsync<SubscriberRow>(
      "SELECT id, name, phone, email, notes, created_at FROM subscribers WHERE id = ?",
      [id],
    );
    return row ? mapSubscriber(row) : null;
  });
}

export async function getSubscriberById(id: string): Promise<Subscriber | null> {
  try {
    const database = await getDatabase();
    const row = await database.getFirstAsync<SubscriberRow>(
      "SELECT id, name, phone, email, notes, created_at FROM subscribers WHERE id = ?",
      [id],
    );
    return row ? mapSubscriber(row) : null;
  } catch (error) {
    throw databaseError("Read subscriber", error);
  }
}

export async function listSubscribers(search = ""): Promise<Subscriber[]> {
  try {
    const database = await getDatabase();
    const query = search.trim();
    const rows = await database.getAllAsync<SubscriberRow>(
      `SELECT id, name, phone, email, notes, created_at
       FROM subscribers
       WHERE ? = '' OR name LIKE ? COLLATE NOCASE OR phone LIKE ? OR email LIKE ? COLLATE NOCASE
       ORDER BY name COLLATE NOCASE`,
      [query, `%${query}%`, `%${query}%`, `%${query}%`],
    );
    return rows.map(mapSubscriber);
  } catch (error) {
    throw databaseError("List subscribers", error);
  }
}

export type SubscriberDeletionResult =
  | { deleted: true }
  | { deleted: false; reason: "not_found" }
  | { deleted: false; reason: "has_history"; subscriptionCount: number };

export async function getSubscriberSubscriptionCount(id: string): Promise<number> {
  try {
    const database = await getDatabase();
    const row = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM subscription_periods WHERE subscriber_id = ?",
      [id],
    );
    return row?.count ?? 0;
  } catch (error) {
    throw databaseError("Count subscriber subscriptions", error);
  }
}

export async function deleteSubscriber(id: string): Promise<SubscriberDeletionResult> {
  return withDatabaseTransaction("Delete subscriber", async (database) => {
    const linkedRow = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM subscription_periods WHERE subscriber_id = ?",
      [id],
    );
    const subscriptionCount = linkedRow?.count ?? 0;
    if (subscriptionCount > 0) {
      return { deleted: false, reason: "has_history", subscriptionCount };
    }

    const result = await database.runAsync("DELETE FROM subscribers WHERE id = ?", [id]);
    return result.changes > 0
      ? { deleted: true }
      : { deleted: false, reason: "not_found" };
  });
}
