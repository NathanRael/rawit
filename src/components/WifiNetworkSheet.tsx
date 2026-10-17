import { FormSheet } from "@/components/FormSheet";
import { WifiNetworkForm } from "@/components/WifiNetworkForm";

type WifiNetworkSheetProps = {
  visible: boolean;
  networkId?: string;
  onClose: () => void;
  onSaved: (networkId: string) => void;
};

export function WifiNetworkSheet({ visible, networkId, onClose, onSaved }: WifiNetworkSheetProps) {
  return (
    <FormSheet
      description={
        networkId
          ? "Update this network’s saved details."
          : "Choose a clear name. SSID and notes are optional."
      }
      onClose={onClose}
      title={networkId ? "Edit network" : "Add WiFi network"}
      visible={visible}
    >
      {visible ? (
        <WifiNetworkForm
          key={networkId ?? "new-network"}
          embedded
          networkId={networkId}
          onCancel={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </FormSheet>
  );
}
