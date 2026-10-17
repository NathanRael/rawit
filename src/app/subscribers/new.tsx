import { useRouter } from "expo-router";

import { AppScreenFrame } from "@/components/AppScreenFrame";
import { SubscriberForm } from "@/components/SubscriberForm";
import { subscribersHref } from "@/lib/navigation";

export default function NewSubscriberScreen() {
  const router = useRouter();

  return (
    <AppScreenFrame
      onBack={() => {
        if (router.canGoBack()) router.back();
        else router.replace(subscribersHref);
      }}
      subtitle="Save subscriber contact details for subscription records."
      title="Add subscriber"
    >
      <SubscriberForm />
    </AppScreenFrame>
  );
}
