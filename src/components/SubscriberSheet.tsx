import { FormSheet } from "@/components/FormSheet";
import { SubscriberForm } from "@/components/SubscriberForm";

const SNAP_POINTS = ["50%", "90%"];

type SubscriberSheetProps = {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export function SubscriberSheet({ visible, onClose, onCreated }: SubscriberSheetProps) {
  return (
    <FormSheet
      description="Drag the handle up to expand, or down to close."
      onClose={onClose}
      snapPoints={SNAP_POINTS}
      title="Add subscriber"
      visible={visible}
    >
      <SubscriberForm embedded onCancel={onClose} onCreated={onCreated} />
    </FormSheet>
  );
}
