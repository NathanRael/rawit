import { useLocalSearchParams, useRouter } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { WifiNetworkForm } from "@/components/WifiNetworkForm";
import { AppScreenFrame } from "@/components/AppScreenFrame";
import { wifiNetworksHref } from "@/lib/navigation";

export default function EditWifiNetworkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const networkId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  return (
    <AppScreenFrame
      onBack={() => {
        if (router.canGoBack()) router.back();
        else router.replace(wifiNetworksHref);
      }}
      subtitle="Update this network's saved details."
      title="Edit network"
    >
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
