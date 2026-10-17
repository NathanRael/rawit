import { View, type StyleProp, type ViewStyle } from "react-native";

import { ThemedText } from "@/components/ThemedText";

const toneClasses = {
  success: "bg-success",
  warning: "bg-brand",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-neutral",
} as const;

type BadgeProps = {
  label: string;
  tone?: keyof typeof toneClasses;
  style?: StyleProp<ViewStyle>;
};

export function Badge({ label, tone = "neutral", style }: BadgeProps) {
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
      className={`self-start rounded-pill border-2 border-ink px-3 py-1 ${toneClasses[tone]}`}
      style={style}
    >
      <ThemedText variant="caption">{label}</ThemedText>
    </View>
  );
}
