import { useRouter } from "expo-router";

import { AppScreenFrame } from "@/components/AppScreenFrame";
import { SubscriberSheet } from "@/components/SubscriberSheet";
import { subscriberDetailsHref, subscribersHref } from "@/lib/navigation";

export default function NewSubscriberScreen() {
  const router = useRouter();
  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace(subscribersHref);
  };

  return (
    <AppScreenFrame
      onBack={close}
      subtitle="Save subscriber contact details for subscription records."
      title="Add subscriber"
    >
      <SubscriberSheet
        onClose={close}
        onSaved={(subscriberId) => router.replace(subscriberDetailsHref(subscriberId))}
        visible
      />
    </AppScreenFrame>
  );
}
