import { FormSheet } from "@/components/FormSheet";
import { SubscriberForm } from "@/components/SubscriberForm";

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
      title="Add subscriber"
      visible={visible}
    >
      <SubscriberForm embedded onCancel={onClose} onCreated={onCreated} />
    </FormSheet>
  );
}
