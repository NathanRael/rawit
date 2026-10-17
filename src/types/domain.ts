export type LocalDate = string;

export type DurationUnit = "day" | "week" | "month";

export type SubscriptionLifecycleStatus =
  | "active"
  | "expiring_soon"
  | "expired"
  | "cancelled";

export type PaymentStatus = "paid" | "unpaid" | "partially_paid";

export interface WifiNetwork {
  id: string;
  name: string;
  ssid: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Subscriber {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
}

export interface SubscriptionPeriodRecord {
  id: string;
  subscriberId: string;
  wifiNetworkId: string;
  startDate: LocalDate;
  durationValue: number;
  durationUnit: DurationUnit;
  amount: number;
  cancelledAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface SubscriptionPeriod extends SubscriptionPeriodRecord {
  expirationDate: LocalDate;
  lifecycleStatus: SubscriptionLifecycleStatus;
  amountPaid: number;
  paymentCount: number;
  paymentStatus: PaymentStatus;
}

export interface SubscriptionPeriodDetails extends SubscriptionPeriod {
  subscriberName: string;
  wifiNetworkName: string;
}

export interface SubscriberSubscriptionPeriod extends SubscriptionPeriod {
  wifiNetworkName: string;
}

export interface Payment {
  id: string;
  subscriptionId: string;
  amount: number;
  paidAt: LocalDate;
  notes: string | null;
  createdAt: string;
}

export interface NewWifiNetwork {
  name: string;
  ssid?: string | null;
  notes?: string | null;
}

export interface NewSubscriber {
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}

export interface NewSubscriptionPeriod {
  subscriberId: string;
  wifiNetworkId: string;
  startDate: LocalDate;
  durationValue: number;
  durationUnit: DurationUnit;
  amount: number;
  notes?: string | null;
}

export interface NewPayment {
  subscriptionId: string;
  amount: number;
  paidAt: LocalDate;
  notes?: string | null;
}

export interface UpdatePayment {
  amount: number;
  paidAt: LocalDate;
  notes?: string | null;
}
