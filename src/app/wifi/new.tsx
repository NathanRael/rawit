import { WifiNetworkForm } from "@/components/WifiNetworkForm";
import { AppScreenFrame } from "@/components/AppScreenFrame";

export default function NewWifiNetworkScreen() {
  return (
    <AppScreenFrame
      subtitle="Choose a clear name. SSID and notes are optional."
      title="Add WiFi network"
    >
      <WifiNetworkForm />
    </AppScreenFrame>
  );
}
