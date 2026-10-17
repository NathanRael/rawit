import { z } from "zod";

export const BACKUP_VERSION = 1;

const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid local date");

const wifiNetworkSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  ssid: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
});

const subscriberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
});

const durationUnitSchema = z.enum(["day", "week", "month"]);

const subscriptionPeriodSchema = z.object({
  id: z.string().min(1),
  subscriberId: z.string().min(1),
  wifiNetworkId: z.string().min(1),
  startDate: localDateSchema,
  durationValue: z.number().int().positive(),
  durationUnit: durationUnitSchema,
  amount: z.number().finite().nonnegative(),
  cancelledAt: z.string().datetime().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
});

const paymentSchema = z.object({
  id: z.string().min(1),
  subscriptionId: z.string().min(1),
  amount: z.number().finite().positive(),
  paidAt: localDateSchema,
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export const backupSchema = z.object({
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string().datetime(),
  records: z.object({
    wifiNetworks: z.array(wifiNetworkSchema),
    subscribers: z.array(subscriberSchema),
    subscriptionPeriods: z.array(subscriptionPeriodSchema),
    payments: z.array(paymentSchema),
  }),
});

export type BackupData = z.infer<typeof backupSchema>;

export interface BackupValidationResult {
  valid: boolean;
  error?: string;
  data?: BackupData;
}

export interface BackupRestoreResult {
  restored: boolean;
  error?: string;
  importedCounts: {
    wifiNetworks: number;
    subscribers: number;
    subscriptionPeriods: number;
    payments: number;
  };
}

export interface BackupExportResult {
  exported: boolean;
  error?: string;
  filePath?: string;
  shared?: boolean;
}
