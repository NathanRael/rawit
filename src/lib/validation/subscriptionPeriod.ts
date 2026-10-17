import { z } from "zod";

import { parseLocalDate } from "@/lib/dates";

export const subscriptionPeriodSchema = z.object({
  subscriberId: z.string().trim().min(1, "Choose a subscriber."),
  wifiNetworkId: z.string().trim().min(1, "Choose a WiFi network."),
  startDate: z.string().trim().refine((value) => {
    try {
      parseLocalDate(value);
      return true;
    } catch {
      return false;
    }
  }, "Enter a valid date in YYYY-MM-DD format."),
  durationValue: z.string().trim().refine(
    (value) => /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0,
    "Duration must be a positive whole number.",
  ),
  durationUnit: z.enum(["day", "week", "month"]),
  amount: z.string().trim().refine(
    (value) => value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0,
    "Amount must be zero or greater.",
  ),
  notes: z.string().trim(),
});

export type SubscriptionPeriodFormValues = z.infer<typeof subscriptionPeriodSchema>;
