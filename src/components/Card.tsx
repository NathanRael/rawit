import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { hardShadow, roundedCorners } from "@/theme";

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
};

export function Card({ children, style, className }: CardProps) {
  return (
    <View
      className={`rounded-card border-2 border-ink bg-white p-4 ${className ?? ""}`}
      style={[roundedCorners, hardShadow(), style]}
    >
      {children}
    </View>
  );
}
