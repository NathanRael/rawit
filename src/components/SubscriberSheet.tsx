import { FormSheet } from "@/components/FormSheet";
import { SubscriberForm } from "@/components/SubscriberForm";

type SubscriberSheetProps = {
  visible: boolean;
  subscriberId?: string;
  onClose: () => void;
  onSaved: (subscriberId: string) => void;
};

export function SubscriberSheet({ visible, subscriberId, onClose, onSaved }: SubscriberSheetProps) {
  return (
    <FormSheet
      description={
        subscriberId
          ? "Update the saved subscriber details."
          : "Save subscriber contact details for subscription records."
      }
      onClose={onClose}
      title={subscriberId ? "Edit subscriber" : "Add subscriber"}
      visible={visible}
    >
      {visible ? (
        <SubscriberForm
          key={subscriberId ?? "new-subscriber"}
          embedded
          onCancel={onClose}
          onSaved={onSaved}
          subscriberId={subscriberId}
        />
      ) : null}
    </FormSheet>
  );
}
