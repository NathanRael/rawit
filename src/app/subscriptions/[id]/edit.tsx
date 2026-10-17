import { useLocalSearchParams } from "expo-router";

import { AppScreenFrame } from "@/components/AppScreenFrame";
import { SubscriptionPeriodForm } from "@/components/SubscriptionPeriodForm";

export default function EditSubscriptionPeriodScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const periodId = Array.isArray(id) ? id[0] : id;

  return (
    <AppScreenFrame
      subtitle="Change the subscriber, network, dates, amount, or notes for this period."
      title="Edit subscription period"
    >
      <SubscriptionPeriodForm periodId={periodId} />
    </AppScreenFrame>
  );
}
