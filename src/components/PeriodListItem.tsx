import { View } from "react-native";

import { RecordDetail, RecordRow, RecordTitle } from "@/components/RecordRow";
import { SubscriptionStatusBadges } from "@/components/SubscriptionStatusBadges";
import { ThemedText } from "@/components/ThemedText";
import { formatCurrency, formatDateLocal, getRemainingPaymentAmount } from "@/lib/dates";
import type { SubscriptionPeriodDetails } from "@/types";

type PeriodListItemProps = {
  period: SubscriptionPeriodDetails;
  onPress: () => void;
};

const lifecycleText = {
  active: "Active",
  expiring_soon: "Expiring soon",
  expired: "Expired",
  cancelled: "Cancelled",
} as const;

const paymentText = {
  paid: "Paid",
  unpaid: "Unpaid",
  partially_paid: "Partially paid",
} as const;

/** Period row shared by the Overview and Periods screens. */
export function PeriodListItem({ period, onPress }: PeriodListItemProps) {
  const remaining = getRemainingPaymentAmount(period.amount, period.amountPaid);

  return (
    <RecordRow
      accessibilityHint="Open subscription period details"
      accessibilityLabel={`${period.subscriberName} on ${period.wifiNetworkName}, ${formatDateLocal(period.startDate)} to ${formatDateLocal(period.expirationDate)}, ${lifecycleText[period.lifecycleStatus]}, ${paymentText[period.paymentStatus]}, ${formatCurrency(remaining)} remaining`}
      onPress={onPress}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-1">
          <RecordTitle>{period.subscriberName}</RecordTitle>
          <RecordDetail>{period.wifiNetworkName}</RecordDetail>
        </View>
        <View className="items-end">
          <ThemedText variant="caption">Remaining</ThemedText>
          <ThemedText variant="label">{formatCurrency(remaining)}</ThemedText>
        </View>
      </View>
      <RecordDetail>
        {formatDateLocal(period.startDate)} – {formatDateLocal(period.expirationDate)}
      </RecordDetail>
      <View className="pt-1">
        <SubscriptionStatusBadges
          lifecycleStatus={period.lifecycleStatus}
          paymentStatus={period.paymentStatus}
        />
      </View>
    </RecordRow>
  );
}
