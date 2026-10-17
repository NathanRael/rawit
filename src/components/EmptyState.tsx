import { View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Icon, type IconName } from "@/components/Icon";
import { ThemedText } from "@/components/ThemedText";

type EmptyStateProps = {
  icon: IconName;
  title: string;
  description: string;
  action?: {
    label: string;
    onPress: () => void;
    accessibilityHint?: string;
  };
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="items-center gap-4 py-6">
      <View className="h-14 w-14 items-center justify-center rounded-control border-2 border-ink bg-brand">
        <Icon name={icon} size={26} />
      </View>
      <View className="w-full items-center gap-2">
        <ThemedText className="text-center" variant="label">
          {title}
        </ThemedText>
        <ThemedText className="text-center" variant="body">
          {description}
        </ThemedText>
      </View>
      {action ? (
        <Button
          accessibilityHint={action.accessibilityHint}
          onPress={action.onPress}
          style={{ alignSelf: "stretch" }}
          title={action.label}
        />
      ) : null}
    </Card>
  );
}
