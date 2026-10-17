import { AppScreenFrame } from "@/components/AppScreenFrame";
import { SubscriptionPeriodForm } from "@/components/SubscriptionPeriodForm";
import { useLocalSearchParams } from "expo-router";

export default function NewSubscriptionPeriodScreen() {
  const { renewFrom } = useLocalSearchParams<{ renewFrom?: string | string[] }>();
  const renewFromId = Array.isArray(renewFrom) ? renewFrom[0] : renewFrom;

  return (
    <AppScreenFrame
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
