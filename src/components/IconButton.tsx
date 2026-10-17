import { Pressable, type StyleProp, type ViewStyle } from "react-native";

import { Icon, type IconName } from "@/components/Icon";
import { colors, hardShadow, roundedCorners } from "@/theme";

type IconButtonProps = {
  icon: IconName;
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "dark";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const variantClasses = {
  primary: "bg-brand",
  secondary: "bg-white",
  dark: "bg-charcoal",
} as const;

export function IconButton({
  icon,
  label,
  onPress,
  variant = "secondary",
  disabled = false,
  style,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      className={`h-12 w-12 items-center justify-center rounded-control border-2 border-ink ${variantClasses[variant]} ${disabled ? "opacity-50" : ""}`}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        hardShadow(pressed),
        roundedCorners,
        { transform: pressed ? [{ translateX: 2 }, { translateY: 2 }] : undefined },
        style,
      ]}
    >
      <Icon color={variant === "dark" ? colors.white : colors.ink} name={icon} />
    </Pressable>
  );
}
