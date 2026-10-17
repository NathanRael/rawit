import type { ReactNode } from "react";
import { View } from "react-native";

import { Icon } from "@/components/Icon";
import { ThemedText } from "@/components/ThemedText";
import { roundedCorners } from "@/theme";

type AppPageHeaderProps = {
  /** Optional trailing control, such as the Settings button on the home screen. */
  action?: ReactNode;
};

export function AppPageHeader({ action }: AppPageHeaderProps) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <View className="min-w-0 flex-1 flex-row items-center gap-3">
        <View
          className="h-12 w-12 items-center justify-center rounded-control border-2 border-ink bg-brand"
          style={roundedCorners}
        >
          <Icon name="wifi" size={24} />
        </View>
        <View className="min-w-0 flex-1">
          <ThemedText numberOfLines={1} variant="heading">RAWIT</ThemedText>
          <ThemedText className="uppercase" numberOfLines={1} variant="caption">
            WiFi subscriptions
          </ThemedText>
        </View>
      </View>
      {action}
    </View>
  );
}
