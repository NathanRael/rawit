import { z } from "zod";

import { parseLocalDate } from "@/lib/dates";

export const paymentSchema = z.object({
  amount: z.string().trim().refine(
    (value) => value !== "" && Number.isFinite(Number(value)) && Number(value) > 0,
    "Payment amount must be greater than zero.",
  ),
  paidAt: z.string().trim().refine((value) => {
    try {
      parseLocalDate(value);
      return true;
    } catch {
      return false;
    }
  }, "Enter a valid date in YYYY-MM-DD format."),
  notes: z.string().trim(),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;
