import { createClient } from "npm:@supabase/supabase-js@2.118.0";

type DueReminder = {
  user_id: string;
  period_id: string;
  subscriber_name: string;
  network_name: string;
  expiration_date: string;
  days_before: number;
};

function secretKey(): string | null {
  const keys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (keys) {
    try {
      const parsed: unknown = JSON.parse(keys);
      if (typeof parsed === "object" && parsed !== null && "default" in parsed && typeof parsed.default === "string") {
        return parsed.default;
      }
    } catch { /* Legacy local CLI may only supply the service-role key. */ }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? null;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return Response.json({ error: "Method not allowed." }, { status: 405 });
  const cronSecret = Deno.env.get("RAWIT_CRON_SECRET");
  if (!cronSecret || request.headers.get("x-rawit-cron-secret") !== cronSecret) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = secretKey();
  const brevoKey = Deno.env.get("BREVO_API_KEY");
  const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL");
  if (!url || !key || !brevoKey || !senderEmail) {
    return Response.json({ error: "Email delivery is not configured." }, { status: 500 });
  }
  const admin = createClient(url, key, { auth: { persistSession: false } });
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  // Supabase's Data API defaults to a 1,000-row response cap. Page through due rows.
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await admin.rpc("rawit_due_email_reminders").range(offset, offset + 499);
    if (error) return Response.json({ error: "Could not load due reminders." }, { status: 500 });
    const reminders = (data ?? []) as DueReminder[];
    for (const reminder of reminders) {
      const claim = {
        p_user_id: reminder.user_id,
        p_period_id: reminder.period_id,
        p_expiration_date: reminder.expiration_date,
        p_days_before: reminder.days_before,
      };
      const { data: claimed, error: claimError } = await admin.rpc("rawit_claim_email_reminder", claim);
      if (claimError) { failed++; continue; }
      if (!claimed) { skipped++; continue; }

      let delivered = false;
      try {
        const { data: account, error: authError } = await admin.auth.admin.getUserById(reminder.user_id);
        if (authError) throw authError;
        const email = account.user?.email;
        if (!email || !account.user.email_confirmed_at) {
          skipped++;
          continue;
        }
        const timing = reminder.days_before === 0 ? "expires today" :
          `expires in ${reminder.days_before} day${reminder.days_before === 1 ? "" : "s"}`;
        const subject = `RAWIT reminder: subscription ${timing}`;
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: { accept: "application/json", "api-key": brevoKey, "content-type": "application/json" },
          body: JSON.stringify({
            sender: { email: senderEmail, name: Deno.env.get("BREVO_SENDER_NAME") ?? "RAWIT reminders" },
            // Only Supabase Auth's confirmed account email is a recipient.
            to: [{ email }],
            subject,
            textContent: `Reminder: ${reminder.subscriber_name}'s subscription on ${reminder.network_name} ${timing} (${reminder.expiration_date}).`,
            htmlContent: `<p>Reminder: <strong>${escapeHtml(reminder.subscriber_name)}</strong>'s subscription on <strong>${escapeHtml(reminder.network_name)}</strong> ${timing}.</p><p>Expiration date: ${reminder.expiration_date}</p>`,
            tags: ["rawit-reminder"],
          }),
        });
        if (!response.ok) throw new Error(`Brevo rejected delivery: ${response.status}`);
        delivered = true;
        const { error: ledgerError } = await admin.from("rawit_email_deliveries")
          .update({ sent_at: new Date().toISOString() })
          .eq("user_id", reminder.user_id).eq("period_id", reminder.period_id)
          .eq("expiration_date", reminder.expiration_date).eq("days_before", reminder.days_before);
        if (ledgerError) throw ledgerError;
        sent++;
      } catch (cause) {
        failed++;
        console.error("Reminder delivery failed", reminder.user_id, reminder.period_id, cause);
      } finally {
        // Failed attempts can be retried by invoking this function again on the due UTC day.
        // If Brevo accepted the email but ledger update failed, keep the claim to avoid an immediate duplicate.
        if (!delivered) {
          await admin.from("rawit_email_deliveries").delete()
            .eq("user_id", reminder.user_id).eq("period_id", reminder.period_id)
            .eq("expiration_date", reminder.expiration_date).eq("days_before", reminder.days_before);
        }
      }
    }
    if (reminders.length < 500) break;
  }
  return Response.json({ sent, failed, skipped });
});
