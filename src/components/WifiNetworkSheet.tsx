import { FormSheet } from "@/components/FormSheet";
import { WifiNetworkForm } from "@/components/WifiNetworkForm";

const SNAP_POINTS = ["50%", "90%"];

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
      snapPoints={SNAP_POINTS}
      title="Add WiFi network"
      visible={visible}
    >
      <WifiNetworkForm embedded onCancel={onClose} onCreated={onCreated} />
    </FormSheet>
  );
}
