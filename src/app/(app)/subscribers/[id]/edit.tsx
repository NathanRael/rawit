import { useLocalSearchParams, useRouter } from "expo-router";

import { AppScreenFrame } from "@/components/AppScreenFrame";
import { SubscriberSheet } from "@/components/SubscriberSheet";
import { ThemedText } from "@/components/ThemedText";
import { subscriberDetailsHref, subscribersHref } from "@/lib/navigation";

export default function EditSubscriberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const subscriberId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace(subscribersHref);
  };

  return (
    <AppScreenFrame
      onBack={close}
      subtitle="Update the saved subscriber details."
      title="Edit subscriber"
    >
      {subscriberId ? (
        <SubscriberSheet
          onClose={close}
          onSaved={(savedId) => router.replace(subscriberDetailsHref(savedId))}
          subscriberId={subscriberId}
          visible
        />
      ) : (
        <ThemedText accessibilityRole="alert">A subscriber ID is required to edit a subscriber.</ThemedText>
      )}
    </AppScreenFrame>
  );
}
