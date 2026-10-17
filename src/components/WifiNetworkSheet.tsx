import { FormSheet } from "@/components/FormSheet";
import { WifiNetworkForm } from "@/components/WifiNetworkForm";

type WifiNetworkSheetProps = {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export function WifiNetworkSheet({ visible, onClose, onCreated }: WifiNetworkSheetProps) {
  return (
    <FormSheet
      description="Drag the handle up to expand, or down to close."
      onClose={onClose}
      title="Add WiFi network"
      visible={visible}
    >
      <WifiNetworkForm embedded onCancel={onClose} onCreated={onCreated} />
    </FormSheet>
  );
}
