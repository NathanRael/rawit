import { View } from "react-native";

import { Button } from "@/components/Button";

type FormActionsProps = {
  saveTitle: string;
  isSubmitting: boolean;
  onSave: () => void;
  onCancel: () => void;
};

/** Primary save action above a secondary cancel action, used by every form. */
export function FormActions({ saveTitle, isSubmitting, onSave, onCancel }: FormActionsProps) {
  return (
    <View className="gap-3">
      <Button loading={isSubmitting} onPress={onSave} title={saveTitle} />
      <Button disabled={isSubmitting} onPress={onCancel} title="Cancel" variant="secondary" />
    </View>
  );
}
