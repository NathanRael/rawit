import { FormSheet } from "@/components/FormSheet";
import { PaymentForm } from "@/components/PaymentForm";
import type { Payment } from "@/types";

type PaymentSheetProps = {
  visible: boolean;
  subscriptionId: string;
  /** Present when editing an existing payment; absent when recording a new one. */
  payment?: Payment;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

export function PaymentSheet({
  visible,
  subscriptionId,
  payment,
  onClose,
  onSaved,
}: PaymentSheetProps) {
  return (
    <FormSheet
      description="Enter the amount and the date it was paid."
      onClose={onClose}
      title={payment ? "Edit payment" : "Record payment"}
      visible={visible}
    >
      {visible ? (
        <PaymentForm
          key={payment?.id ?? "new-payment"}
          onCancel={onClose}
          onSaved={onSaved}
          payment={payment}
          subscriptionId={subscriptionId}
        />
      ) : null}
    </FormSheet>
  );
}
