import { useState } from "react";
import type { ReactNode } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppPageHeader } from "@/components/AppPageHeader";
import { IconButton } from "@/components/IconButton";
import { ThemedText } from "@/components/ThemedText";
import { colors, spacing } from "@/theme";

type AppScreenFrameProps = {
  title: string;
  subtitle?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** When set, shows a back header instead of the brand header (subpages only). */
  onBack?: () => void;
  /** Trailing control in the header, such as Settings (top-level) or an overflow menu (subpages). */
  headerAction?: ReactNode;
  children: ReactNode;
};

export function AppScreenFrame({
  title,
  subtitle,
  refreshing = false,
  onRefresh,
  onBack,
  headerAction,
  children,
}: AppScreenFrameProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={["top", "left", "right"]} style={{ flex: 1 }}>
      <View
        className="z-10"
        style={{
          backgroundColor: isScrolled ? colors.canvas : "transparent",
          borderBottomColor: "rgba(0, 0, 0, 0.12)",
          borderBottomWidth: isScrolled ? StyleSheet.hairlineWidth : 0,
        }}
      >
        <View className="gap-6 px-4 pb-6 pt-4">
          {onBack ? (
            <>
              <View className="flex-row items-center gap-3">
                <IconButton icon="back" label="Go back" onPress={onBack} />
                <ThemedText className="min-w-0 flex-1" numberOfLines={2} variant="title">
                  {title}
                </ThemedText>
                {headerAction ? (
                  <View className="h-12 w-12 shrink-0 items-center justify-center">{headerAction}</View>
                ) : null}
              </View>
              {subtitle ? <ThemedText variant="body">{subtitle}</ThemedText> : null}
            </>
          ) : (
            <>
              <AppPageHeader action={headerAction} />
              <View className="gap-2">
                <ThemedText variant="title">{title}</ThemedText>
                {subtitle ? <ThemedText variant="body">{subtitle}</ThemedText> : null}
              </View>
            </>
          )}
        </View>
      </View>
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
        onScroll={({ nativeEvent }) => {
          const nextIsScrolled = nativeEvent.contentOffset.y > 4;
          setIsScrolled((current) => (current === nextIsScrolled ? current : nextIsScrolled));
        }}
        scrollEventThrottle={16}
        contentContainerStyle={{
          gap: spacing.xl,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
