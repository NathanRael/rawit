import { useRouter } from "expo-router";

import { AppScreenFrame } from "@/components/AppScreenFrame";
import { WifiNetworkSheet } from "@/components/WifiNetworkSheet";
import { wifiNetworkDetailsHref, wifiNetworksHref } from "@/lib/navigation";

export default function NewWifiNetworkScreen() {
  const router = useRouter();
  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace(wifiNetworksHref);
  };

  return (
    <AppScreenFrame
      onBack={close}
      subtitle="Choose a clear name. SSID and notes are optional."
      title="Add WiFi network"
    >
      <WifiNetworkSheet
        onClose={close}
        onSaved={(networkId) => router.replace(wifiNetworkDetailsHref(networkId))}
        visible
      />
    </AppScreenFrame>
  );
}
