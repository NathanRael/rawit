import { useLocalSearchParams, useRouter } from "expo-router";

import { AppScreenFrame } from "@/components/AppScreenFrame";
import { ThemedText } from "@/components/ThemedText";
import { WifiNetworkSheet } from "@/components/WifiNetworkSheet";
import { wifiNetworkDetailsHref, wifiNetworksHref } from "@/lib/navigation";

export default function EditWifiNetworkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const networkId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace(wifiNetworksHref);
  };

  return (
    <AppScreenFrame
      onBack={close}
      subtitle="Update this network's saved details."
      title="Edit network"
    >
      {networkId ? (
        <WifiNetworkSheet
          networkId={networkId}
          onClose={close}
          onSaved={(savedId) => router.replace(wifiNetworkDetailsHref(savedId))}
          visible
        />
      ) : (
        <ThemedText accessibilityRole="alert">
          A network ID is required to edit a WiFi network.
        </ThemedText>
      )}
    </AppScreenFrame>
  );
}
