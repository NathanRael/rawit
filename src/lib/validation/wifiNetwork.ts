import { z } from "zod";

export const wifiNetworkSchema = z.object({
  name: z.string().trim().min(1, "Enter a network name."),
  ssid: z.string().trim(),
  notes: z.string().trim(),
});

export type WifiNetworkFormValues = z.infer<typeof wifiNetworkSchema>;
