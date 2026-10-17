import type { ReactNode } from "react";
import { Text, type StyleProp, type TextProps, type TextStyle } from "react-native";

import { type as typography } from "@/theme";

type TextVariant = keyof typeof typography;

type ThemedTextProps = TextProps & {
  variant?: TextVariant;
  className?: string;
  children: ReactNode;
  style?: StyleProp<TextStyle>;
};

export function ThemedText({
  variant = "body",
  className,
  style,
  children,
  ...props
}: ThemedTextProps) {
  return (
    <Text className={`text-ink ${className ?? ""}`} style={[typography[variant], style]} {...props}>
      {children}
    </Text>
  );
}
