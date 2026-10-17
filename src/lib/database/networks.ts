import type { WifiNetwork, NewWifiNetwork } from "@/types";

import { createRecordId, nowIso, optionalText } from "./helpers";
import { databaseError, getDatabase, withDatabaseTransaction } from "./index";

interface WifiNetworkRow {
  id: string;
  name: string;
  ssid: string | null;
  notes: string | null;
  created_at: string;
}

export type WifiNetworkDeletionResult =
  | { deleted: true }
  | { deleted: false; reason: "not_found" }
  | { deleted: false; reason: "has_subscriptions"; subscriptionCount: number };

function mapWifiNetwork(row: WifiNetworkRow): WifiNetwork {
  return {
    id: row.id,
    name: row.name,
    ssid: row.ssid,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function validateNetwork(input: NewWifiNetwork): string {
  const name = input.name.trim();
  if (!name) throw new RangeError("A WiFi network name is required.");
  return name;
}

export async function createWifiNetwork(input: NewWifiNetwork): Promise<WifiNetwork> {
  const name = validateNetwork(input);
  const id = createRecordId("wifi");
  const createdAt = nowIso();
  return withDatabaseTransaction("Create WiFi network", async (database) => {
    await database.runAsync(
      "INSERT INTO wifi_networks (id, name, ssid, notes, created_at) VALUES (?, ?, ?, ?, ?)",
      [id, name, optionalText(input.ssid), optionalText(input.notes), createdAt],
    );
    return { id, name, ssid: optionalText(input.ssid), notes: optionalText(input.notes), createdAt };
  });
}

export async function updateWifiNetwork(
  id: string,
  input: NewWifiNetwork,
): Promise<WifiNetwork | null> {
  const name = validateNetwork(input);
  return withDatabaseTransaction("Update WiFi network", async (database) => {
    const result = await database.runAsync(
      "UPDATE wifi_networks SET name = ?, ssid = ?, notes = ? WHERE id = ?",
      [name, optionalText(input.ssid), optionalText(input.notes), id],
    );
    if (result.changes === 0) return null;
    const row = await database.getFirstAsync<WifiNetworkRow>(
      "SELECT id, name, ssid, notes, created_at FROM wifi_networks WHERE id = ?",
      [id],
    );
    return row ? mapWifiNetwork(row) : null;
  });
}

export async function getWifiNetworkById(id: string): Promise<WifiNetwork | null> {
  try {
    const database = await getDatabase();
    const row = await database.getFirstAsync<WifiNetworkRow>(
      "SELECT id, name, ssid, notes, created_at FROM wifi_networks WHERE id = ?",
      [id],
    );
    return row ? mapWifiNetwork(row) : null;
  } catch (error) {
    throw databaseError("Read WiFi network", error);
  }
}

export async function listWifiNetworks(): Promise<WifiNetwork[]> {
  try {
    const database = await getDatabase();
    const rows = await database.getAllAsync<WifiNetworkRow>(
      "SELECT id, name, ssid, notes, created_at FROM wifi_networks ORDER BY name COLLATE NOCASE",
    );
    return rows.map(mapWifiNetwork);
  } catch (error) {
    throw databaseError("List WiFi networks", error);
  }
}

export async function getWifiNetworkSubscriptionCount(id: string): Promise<number> {
  try {
    const database = await getDatabase();
    const row = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM subscription_periods WHERE wifi_network_id = ?",
      [id],
    );
    return row?.count ?? 0;
  } catch (error) {
    throw databaseError("Count WiFi network subscriptions", error);
  }
}

export async function deleteWifiNetwork(id: string): Promise<WifiNetworkDeletionResult> {
  return withDatabaseTransaction("Delete WiFi network", async (database) => {
    const linkedRow = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM subscription_periods WHERE wifi_network_id = ?",
      [id],
    );
    const subscriptionCount = linkedRow?.count ?? 0;
    if (subscriptionCount > 0) {
      return { deleted: false, reason: "has_subscriptions", subscriptionCount };
    }

    const result = await database.runAsync("DELETE FROM wifi_networks WHERE id = ?", [id]);
    return result.changes > 0
      ? { deleted: true }
      : { deleted: false, reason: "not_found" };
  });
}
