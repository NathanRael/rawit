import { useLocalSearchParams } from "expo-router";

import { AppScreenFrame } from "@/components/AppScreenFrame";
import { SubscriberForm } from "@/components/SubscriberForm";
import { ThemedText } from "@/components/ThemedText";

export default function EditSubscriberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const subscriberId = Array.isArray(id) ? id[0] : id;

  return (
    <AppScreenFrame
      subtitle="Update the saved subscriber details."
      title="Edit subscriber"
    >
      {subscriberId ? (
        <SubscriberForm subscriberId={subscriberId} />
      ) : (
        <ThemedText accessibilityRole="alert">A subscriber ID is required to edit a subscriber.</ThemedText>
      )}
    </AppScreenFrame>
  );
}
