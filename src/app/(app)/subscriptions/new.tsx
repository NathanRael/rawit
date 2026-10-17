import { AppScreenFrame } from "@/components/AppScreenFrame";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SubscriptionPeriodSheet } from "@/components/SubscriptionPeriodSheet";
import { subscriptionDetailsHref, subscriptionsHref } from "@/lib/navigation";

export default function NewSubscriptionPeriodScreen() {
  const { renewFrom } = useLocalSearchParams<{ renewFrom?: string | string[] }>();
  const renewFromId = Array.isArray(renewFrom) ? renewFrom[0] : renewFrom;
  const router = useRouter();
  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace(subscriptionsHref);
  };

  return (
    <AppScreenFrame
      onBack={close}
      subtitle={
        renewFromId
          ? "Review the copied details and adjust this new period before saving."
          : "Link a subscriber and WiFi network, then set this period’s dates and amount."
      }
      title={renewFromId ? "Renew subscription" : "New subscription period"}
    >
      <SubscriptionPeriodSheet
        onClose={close}
        onSaved={(periodId) => router.replace(subscriptionDetailsHref(periodId))}
        renewFromId={renewFromId}
        visible
      />
    </AppScreenFrame>
  );
}
