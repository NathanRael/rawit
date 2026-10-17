import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { Icon, type IconName } from "@/components/Icon";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { hardShadow, roundedCorners } from "@/theme";

const alertStyles = {
  success: { accent: "bg-success", icon: "success" },
  error: { accent: "bg-danger", icon: "warning" },
  info: { accent: "bg-info", icon: "bell" },
} as const satisfies Record<string, { accent: string; icon: IconName }>;

type AlertBoxProps = {
  title: string;
  message: string;
  variant?: keyof typeof alertStyles;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export function AlertBox({
  title,
  message,
  variant = "info",
  actionLabel,
  onAction,
  style,
  children,
}: AlertBoxProps) {
  const alert = alertStyles[variant];

  return (
    <View className="rounded-control bg-white" style={[roundedCorners, hardShadow(), style]}>
      <View className="overflow-hidden rounded-control border-2 border-ink bg-white" style={roundedCorners}>
        <View className={`flex-row items-center gap-2 px-3 py-2 ${alert.accent}`}>
          <Icon name={alert.icon} size={18} />
          <ThemedText variant="caption">{title.toUpperCase()}</ThemedText>
        </View>
        <View className="gap-3 p-3">
          <ThemedText variant="body">{message}</ThemedText>
          {children}
          {actionLabel ? (
            <Button disabled={!onAction} onPress={onAction} size="sm" title={actionLabel} variant="primary" />
          ) : null}
        </View>
      </View>
    </View>
  );
}
