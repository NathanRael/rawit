import { useRouter } from "expo-router";

import { WifiNetworkForm } from "@/components/WifiNetworkForm";
import { AppScreenFrame } from "@/components/AppScreenFrame";
import { wifiNetworksHref } from "@/lib/navigation";

export default function NewWifiNetworkScreen() {
  const router = useRouter();

  return (
    <AppScreenFrame
      onBack={() => {
        if (router.canGoBack()) router.back();
        else router.replace(wifiNetworksHref);
      }}
      subtitle="Choose a clear name. SSID and notes are optional."
      title="Add WiFi network"
    >
      <WifiNetworkForm />
    </AppScreenFrame>
  );
}
