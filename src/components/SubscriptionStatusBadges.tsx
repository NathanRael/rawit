import { View } from "react-native";

import { Badge } from "@/components/Badge";
import type { PaymentStatus, SubscriptionLifecycleStatus } from "@/types";

function lifecycleLabel(status: SubscriptionLifecycleStatus): string {
  if (status === "expiring_soon") return "Expiring soon";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function lifecycleTone(status: SubscriptionLifecycleStatus): "success" | "warning" | "danger" | "neutral" {
  if (status === "active") return "success";
  if (status === "expiring_soon") return "warning";
  if (status === "expired") return "danger";
  return "neutral";
}

function paymentLabel(status: PaymentStatus): string {
  if (status === "partially_paid") return "Partially paid";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function paymentTone(status: PaymentStatus): "success" | "warning" | "danger" {
  if (status === "paid") return "success";
  if (status === "partially_paid") return "warning";
  return "danger";
}

type SubscriptionStatusBadgesProps = {
  lifecycleStatus: SubscriptionLifecycleStatus;
  paymentStatus: PaymentStatus;
};

/** Lifecycle and payment status shown as separate badges. */
export function SubscriptionStatusBadges({
  lifecycleStatus,
  paymentStatus,
}: SubscriptionStatusBadgesProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      <Badge label={lifecycleLabel(lifecycleStatus)} tone={lifecycleTone(lifecycleStatus)} />
      <Badge label={paymentLabel(paymentStatus)} tone={paymentTone(paymentStatus)} />
    </View>
  );
}
