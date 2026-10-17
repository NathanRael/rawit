import { View } from "react-native";

import { ThemedText } from "@/components/ThemedText";

type DetailRowProps = {
  label: string;
  value: string;
  emphasized?: boolean;
};

/** Label and value pair for detail cards. Use `emphasized` for the key figure in a group. */
export function DetailRow({ label, value, emphasized = false }: DetailRowProps) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}, ${value}`}
      className="flex-row items-center justify-between gap-4 py-2"
    >
      <ThemedText variant="label">{label}</ThemedText>
      <ThemedText className="flex-1 text-right" variant={emphasized ? "heading" : "body"}>
        {value}
      </ThemedText>
    </View>
  );
}

export function DetailDivider() {
  return <View className="h-0.5 bg-neutral" />;
}
