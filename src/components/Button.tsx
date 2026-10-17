import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { colors, hardShadow, roundedCorners } from "@/theme";

const variantClasses = {
  primary: "bg-brand",
  secondary: "bg-white",
  danger: "bg-danger",
} as const;

const sizeClasses = {
  sm: "min-h-11 px-3 py-2",
  md: "min-h-12 px-4 py-3",
  lg: "min-h-14 px-6 py-4",
} as const;

type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  title: string;
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityState,
  onPressIn,
  onPressOut,
  ...pressableProps
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const unavailable = disabled || loading;

  return (
    <Pressable
      {...pressableProps}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{
        ...accessibilityState,
        disabled: unavailable || accessibilityState?.disabled,
        busy: loading || accessibilityState?.busy,
      }}
      className={`flex-row items-center justify-center gap-2 rounded-control border-2 border-ink ${variantClasses[variant]} ${sizeClasses[size]} ${unavailable ? "opacity-50" : ""}`}
      disabled={unavailable}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
      style={[
        hardShadow(pressed),
        roundedCorners,
        { transform: pressed ? [{ translateX: 2 }, { translateY: 2 }] : undefined },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={colors.ink} /> : null}
      <ThemedText variant="label">{title}</ThemedText>
    </Pressable>
  );
}
