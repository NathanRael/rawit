const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ReminderRequest = {
  subscriberName: string;
  networkName: string;
  expirationDate: string;
  daysBeforeExpiration: 0 | 1 | 3;
};

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function parseReminderRequest(value: unknown): ReminderRequest | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  const { subscriberName, networkName, expirationDate, daysBeforeExpiration } = candidate;

  if (
    typeof subscriberName !== "string" || subscriberName.trim().length === 0 || subscriberName.length > 120 ||
    typeof networkName !== "string" || networkName.trim().length === 0 || networkName.length > 120 ||
    typeof expirationDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(expirationDate) ||
    (daysBeforeExpiration !== 0 && daysBeforeExpiration !== 1 && daysBeforeExpiration !== 3)
  ) return null;

  const date = new Date(`${expirationDate}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== expirationDate) return null;

  return {
    subscriberName: subscriberName.trim(),
    networkName: networkName.trim(),
    expirationDate,
    daysBeforeExpiration,
  };
}

function reminderText(daysBeforeExpiration: ReminderRequest["daysBeforeExpiration"]): string {
  if (daysBeforeExpiration === 0) return "expires today";
  return `expires in ${daysBeforeExpiration} day${daysBeforeExpiration === 1 ? "" : "s"}`;
}

function getSupabasePublishableKey(): string | null {
  const publishableKeysJson = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (publishableKeysJson) {
    try {
      const publishableKeys: unknown = JSON.parse(publishableKeysJson);
      if (
        typeof publishableKeys === "object" && publishableKeys !== null &&
        "default" in publishableKeys && typeof publishableKeys.default === "string"
      ) return publishableKeys.default;
    } catch {
      // Fall back to the legacy anon-key variable for older local Supabase CLIs.
    }
  }
  return Deno.env.get("SUPABASE_ANON_KEY") ?? null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") return jsonResponse(405, { error: "Method not allowed." });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabasePublishableKey = getSupabasePublishableKey();
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL");
  const senderName = Deno.env.get("BREVO_SENDER_NAME") ?? "RAWIT reminders";
  if (!supabaseUrl || !supabasePublishableKey || !brevoApiKey || !senderEmail) {
    return jsonResponse(500, { error: "Email delivery is not configured." });
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return jsonResponse(401, { error: "Sign in to send a reminder." });

  let authResponse: Response;
  try {
    authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabasePublishableKey, Authorization: authorization },
    });
  } catch {
    return jsonResponse(503, { error: "Could not verify the signed-in account." });
  }
  if (!authResponse.ok) return jsonResponse(401, { error: "Sign in to send a reminder." });

  const user: { email?: unknown; email_confirmed_at?: unknown } = await authResponse.json();
  if (typeof user.email !== "string" || typeof user.email_confirmed_at !== "string") {
    return jsonResponse(403, { error: "A confirmed account email is required." });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: "Request body must be valid JSON." });
  }
  const isTestRequest = typeof body === "object" && body !== null && "type" in body && body.type === "test";
  let subject: string;
  let textContent: string;
  let htmlContent: string;
  if (isTestRequest) {
    subject = "RAWIT reminder email test";
    textContent = "This is a test email confirming that RAWIT can send reminders to your connected account email.";
    htmlContent = "<p>This is a test email confirming that RAWIT can send reminders to your connected account email.</p>";
  } else {
    const reminder = parseReminderRequest(body);
    if (!reminder) return jsonResponse(400, { error: "Reminder details are invalid." });

    const timing = reminderText(reminder.daysBeforeExpiration);
    const escapedSubscriber = escapeHtml(reminder.subscriberName);
    const escapedNetwork = escapeHtml(reminder.networkName);
    subject = `RAWIT reminder: subscription ${timing}`;
    textContent = `Reminder: ${reminder.subscriberName}'s subscription on ${reminder.networkName} ${timing} (${reminder.expirationDate}).`;
    htmlContent = `<p>Reminder: <strong>${escapedSubscriber}</strong>'s subscription on <strong>${escapedNetwork}</strong> ${timing}.</p><p>Expiration date: ${reminder.expirationDate}</p>`;
  }

  let brevoResponse: Response;
  try {
    brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        // Recipient is always the verified, connected Supabase user's email.
        to: [{ email: user.email }],
        subject,
        htmlContent,
        textContent,
        tags: ["rawit-reminder"],
      }),
    });
  } catch {
    return jsonResponse(502, { error: "Brevo could not be reached. Try again later." });
  }
  if (!brevoResponse.ok) return jsonResponse(502, { error: "Brevo could not send the reminder." });

  return jsonResponse(200, { sent: true });
});
