import { View } from "react-native";

import { Badge } from "@/components/Badge";
import { Icon } from "@/components/Icon";
import { ThemedText } from "@/components/ThemedText";
import { roundedCorners } from "@/theme";

type AppPageHeaderProps = {
  pageName: string;
};

export function AppPageHeader({ pageName }: AppPageHeaderProps) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <View className="flex-row items-center gap-3">
        <View
          className="h-12 w-12 items-center justify-center rounded-control border-2 border-ink bg-brand"
          style={roundedCorners}
        >
          <Icon name="wifi" size={24} />
        </View>
        <View>
          <ThemedText variant="heading">RAWIT</ThemedText>
          <ThemedText className="uppercase" variant="caption">
            WiFi subscriptions
          </ThemedText>
        </View>
      </View>
      <Badge label={pageName} tone="info" />
    </View>
  );
}
