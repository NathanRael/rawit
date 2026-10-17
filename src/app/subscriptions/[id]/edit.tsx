import { useLocalSearchParams, useRouter } from "expo-router";

import { AppScreenFrame } from "@/components/AppScreenFrame";
import { SubscriptionPeriodForm } from "@/components/SubscriptionPeriodForm";
import { subscriptionsHref } from "@/lib/navigation";

export default function EditSubscriptionPeriodScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const periodId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  return (
    <AppScreenFrame
      onBack={() => {
        if (router.canGoBack()) router.back();
        else router.replace(subscriptionsHref);
      }}
      subtitle="Change the subscriber, network, dates, amount, or notes for this period."
      title="Edit subscription period"
    >
      <SubscriptionPeriodForm periodId={periodId} />
    </AppScreenFrame>
  );
}
