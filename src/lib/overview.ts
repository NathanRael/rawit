import type { SubscriptionPeriodDetails } from "@/types";

export interface OverviewSummary {
  activeCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  unpaidPeriodCount: number;
  totalUnpaid: number;
  attentionPeriods: SubscriptionPeriodDetails[];
}

export function summarizeOverview(periods: SubscriptionPeriodDetails[]): OverviewSummary {
  const attentionPeriods = periods
    .filter(
      (period) =>
        period.lifecycleStatus === "expiring_soon" ||
        period.lifecycleStatus === "expired" ||
        period.paymentStatus !== "paid",
    )
    .sort(
      (first, second) =>
        first.expirationDate.localeCompare(second.expirationDate) ||
        first.subscriberName.localeCompare(second.subscriberName),
    );

  return {
    activeCount: periods.filter((period) => period.lifecycleStatus === "active").length,
    expiringSoonCount: periods.filter((period) => period.lifecycleStatus === "expiring_soon").length,
    expiredCount: periods.filter((period) => period.lifecycleStatus === "expired").length,
    unpaidPeriodCount: periods.filter((period) => period.paymentStatus !== "paid").length,
    totalUnpaid: periods.reduce(
      (total, period) => total + Math.max(0, period.amount - period.amountPaid),
      0,
    ),
    attentionPeriods,
  };
}
