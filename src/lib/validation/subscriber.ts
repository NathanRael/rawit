import { z } from "zod";

export const subscriberSchema = z.object({
  name: z.string().trim().min(1, "Enter a subscriber name."),
  phone: z.string().trim(),
  email: z.string().trim().refine(
    (email) => email.length === 0 || z.email().safeParse(email).success,
    "Enter a valid email address.",
  ),
  notes: z.string().trim(),
});

export type SubscriberFormValues = z.infer<typeof subscriberSchema>;
