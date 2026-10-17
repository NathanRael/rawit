import { FormSheet } from "@/components/FormSheet";
import { SubscriptionPeriodForm } from "@/components/SubscriptionPeriodForm";

type SubscriptionPeriodSheetProps = {
  visible: boolean;
  periodId?: string;
  renewFromId?: string;
  onClose: () => void;
  onSaved: (periodId: string) => void | Promise<void>;
};

export function SubscriptionPeriodSheet({
  visible,
  periodId,
  renewFromId,
  onClose,
  onSaved,
}: SubscriptionPeriodSheetProps) {
  const title = periodId
    ? "Edit subscription period"
    : renewFromId
      ? "Renew subscription"
      : "New subscription period";

  return (
    <FormSheet
      description={
        periodId
          ? "Change the subscriber, network, dates, amount, or notes for this period."
          : renewFromId
            ? "Review the copied details and adjust this new period before saving."
            : "Link a subscriber and WiFi network, then set this period’s dates and amount."
      }
      onClose={onClose}
      maxHeightRatio={0.95}
      title={title}
      visible={visible}
    >
      {visible ? (
        <SubscriptionPeriodForm
          key={periodId ?? renewFromId ?? "new-period"}
          embedded
          onCancel={onClose}
          onSaved={onSaved}
          periodId={periodId}
          renewFromId={renewFromId}
        />
      ) : null}
    </FormSheet>
  );
}
