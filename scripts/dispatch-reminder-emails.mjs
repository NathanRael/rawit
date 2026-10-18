import { readFile } from "node:fs/promises";

const env = await readFile(new URL("../supabase/functions/.env", import.meta.url), "utf8");
const line = env.split(/\r?\n/).find((entry) => entry.startsWith("RAWIT_CRON_SECRET="));
const secret = line?.slice("RAWIT_CRON_SECRET=".length).trim().replace(/^['"]|['"]$/g, "");
if (!secret || secret === "replace-with-a-long-random-secret") {
  throw new Error("Set RAWIT_CRON_SECRET in supabase/functions/.env first.");
}

const response = await fetch("http://127.0.0.1:54321/functions/v1/dispatch-reminder-emails", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-rawit-cron-secret": secret },
  body: "{}",
});
const result = await response.json();
if (!response.ok) throw new Error(`Local reminder dispatch failed: ${response.status}`);
console.log(result);
