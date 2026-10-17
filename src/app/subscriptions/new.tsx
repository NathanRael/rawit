import { AppScreenFrame } from "@/components/AppScreenFrame";
import { SubscriptionPeriodForm } from "@/components/SubscriptionPeriodForm";
import { useLocalSearchParams, useRouter } from "expo-router";
import { subscriptionsHref } from "@/lib/navigation";

export default function NewSubscriptionPeriodScreen() {
  const { renewFrom } = useLocalSearchParams<{ renewFrom?: string | string[] }>();
  const renewFromId = Array.isArray(renewFrom) ? renewFrom[0] : renewFrom;
  const router = useRouter();

  return (
    <AppScreenFrame
      onBack={() => {
        if (router.canGoBack()) router.back();
        else router.replace(subscriptionsHref);
      }}
      subtitle={
        renewFromId
          ? "Review the copied details and adjust this new period before saving."
          : "Link a subscriber and WiFi network, then set this period’s dates and amount."
      }
      title={renewFromId ? "Renew subscription" : "New subscription period"}
    >
      <SubscriptionPeriodForm renewFromId={renewFromId} />
    </AppScreenFrame>
  );
}
