import { useLocalSearchParams } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { WifiNetworkForm } from "@/components/WifiNetworkForm";
import { AppScreenFrame } from "@/components/AppScreenFrame";

export default function EditWifiNetworkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const networkId = Array.isArray(id) ? id[0] : id;

  return (
    <AppScreenFrame subtitle="Update this network's saved details." title="Edit network">
      {networkId ? (
        <WifiNetworkForm networkId={networkId} />
      ) : (
        <ThemedText accessibilityRole="alert">
          A network ID is required to edit a WiFi network.
        </ThemedText>
      )}
    </AppScreenFrame>
  );
}
