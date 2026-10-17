import { AppScreenFrame } from "@/components/AppScreenFrame";
import { SubscriptionPeriodForm } from "@/components/SubscriptionPeriodForm";

export default function NewSubscriptionPeriodScreen() {
  return (
    <AppScreenFrame
      subtitle="Link a subscriber and WiFi network, then set this period’s dates and amount."
      title="New subscription period"
    >
      <SubscriptionPeriodForm />
    </AppScreenFrame>
  );
}
