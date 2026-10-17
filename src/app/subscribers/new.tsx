import { AppScreenFrame } from "@/components/AppScreenFrame";
import { SubscriberForm } from "@/components/SubscriberForm";

export default function NewSubscriberScreen() {
  return (
    <AppScreenFrame
      subtitle="Save subscriber contact details for subscription records."
      title="Add subscriber"
    >
      <SubscriberForm />
    </AppScreenFrame>
  );
}
