import { Pressable, type StyleProp, type ViewStyle } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { hardShadow } from "@/theme";

type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function FilterChip({ label, selected, onPress, disabled = false, style }: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      className={`min-h-11 flex-row items-center justify-center rounded-pill border-2 border-ink px-4 ${selected ? "bg-brand" : "bg-white"} ${disabled ? "opacity-50" : ""}`}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        hardShadow(pressed),
        { transform: pressed ? [{ translateX: 2 }, { translateY: 2 }] : undefined },
        style,
      ]}
    >
      <ThemedText variant="label">{label}</ThemedText>
    </Pressable>
  );
}
