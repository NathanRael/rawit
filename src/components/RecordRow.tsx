import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { ThemedText } from "@/components/ThemedText";

type RecordRowProps = {
  accessibilityLabel: string;
  accessibilityHint?: string;
  onPress: () => void;
  /** Icon or initials tile shown at the start of the row. */
  leading?: ReactNode;
  children: ReactNode;
};

/** Pressable list item used for records (networks, subscribers, periods). */
export function RecordRow({
  accessibilityLabel,
  accessibilityHint,
  onPress,
  leading,
  children,
}: RecordRowProps) {
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className="min-h-11"
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <Card className="flex-row items-center gap-3">
        {leading}
        <View className="min-w-0 flex-1 gap-1">{children}</View>
        <Icon name="chevron" size={18} />
      </Card>
    </Pressable>
  );
}

type RecordLeadingTileProps = {
  children: ReactNode;
  tone?: "brand" | "neutral";
};

/** Square tile for the leading icon or initials of a record row. */
export function RecordLeadingTile({ children, tone = "brand" }: RecordLeadingTileProps) {
  return (
    <View
      className={`h-12 w-12 items-center justify-center rounded-control border-2 border-ink ${tone === "brand" ? "bg-brand" : "bg-neutral"}`}
    >
      {children}
    </View>
  );
}

/** Primary line of a record row. Truncates to one line so long names keep the row layout intact. */
export function RecordTitle({ children }: { children: ReactNode }) {
  return (
    <ThemedText numberOfLines={1} variant="label">
      {children}
    </ThemedText>
  );
}

/** Supporting line of a record row. */
export function RecordDetail({ children }: { children: ReactNode }) {
  return (
    <ThemedText numberOfLines={1} variant="caption">
      {children}
    </ThemedText>
  );
}
