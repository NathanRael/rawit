import { useLocalSearchParams, useRouter } from "expo-router";

import { AppScreenFrame } from "@/components/AppScreenFrame";
import { SubscriptionPeriodSheet } from "@/components/SubscriptionPeriodSheet";
import { ThemedText } from "@/components/ThemedText";
import { subscriptionDetailsHref, subscriptionsHref } from "@/lib/navigation";

export default function EditSubscriptionPeriodScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const periodId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace(subscriptionsHref);
  };

  return (
    <AppScreenFrame
      onBack={close}
      subtitle="Change the subscriber, network, dates, amount, or notes for this period."
      title="Edit subscription period"
    >
      {periodId ? (
        <SubscriptionPeriodSheet
          onClose={close}
          onSaved={(savedId) => router.replace(subscriptionDetailsHref(savedId))}
          periodId={periodId}
          visible
        />
      ) : (
        <ThemedText accessibilityRole="alert">
          A subscription period ID is required to edit a period.
        </ThemedText>
      )}
    </AppScreenFrame>
  );
}
