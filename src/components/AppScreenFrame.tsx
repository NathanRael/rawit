import type { ReactNode } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppPageHeader } from "@/components/AppPageHeader";
import { ThemedText } from "@/components/ThemedText";
import { spacing } from "@/theme";

type AppScreenFrameProps = {
  title: string;
  pageName?: string;
  subtitle?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  children: ReactNode;
};

export function AppScreenFrame({
  title,
  pageName = title,
  subtitle,
  refreshing = false,
  onRefresh,
  children,
}: AppScreenFrameProps) {
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={["top", "left", "right"]} style={{ flex: 1 }}>
      <ScrollView
        className="flex-1"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              accessibilityLabel={`Refresh ${title.toLowerCase()}`}
              onRefresh={onRefresh}
              refreshing={refreshing}
            />
          ) : undefined
        }
        contentContainerStyle={{
          gap: spacing.xl,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppPageHeader pageName={pageName} />
        <View className="gap-2">
          <ThemedText variant="heading">{title}</ThemedText>
          {subtitle ? <ThemedText variant="body">{subtitle}</ThemedText> : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
