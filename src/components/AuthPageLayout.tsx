import type { ReactNode, RefObject } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "@/components/Icon";
import { ThemedText } from "@/components/ThemedText";
import { spacing } from "@/theme";

type AuthPageLayoutProps = {
  step: string;
  title: string;
  highlight: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  topAction?: ReactNode;
  scrollRef: RefObject<ScrollView | null>;
};

function DotMotif() {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no" className="items-end gap-3">
      <View className="gap-1.5">
        {Array.from({ length: 5 }, (_, row) => (
          <View className="flex-row gap-1.5" key={row}>
            {Array.from({ length: 5 }, (_, column) => (
              <View className="h-1 w-1 rounded-pill bg-ink" key={column} />
            ))}
          </View>
        ))}
      </View>
      <View className="h-14 w-14 items-center justify-center border-2 border-ink bg-brand">
        <Icon name="wifi" size={30} />
      </View>
    </View>
  );
}

export function AuthPageLayout({
  step,
  title,
  highlight,
  subtitle,
  children,
  footer,
  topAction,
  scrollRef,
}: AuthPageLayoutProps) {
  const { width } = useWindowDimensions();
  const headlineVariant = width < 370 ? "authDisplayCompact" : "authDisplay";

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        enabled={Platform.OS === "ios"}
      >
        <ScrollView
          ref={scrollRef}
          className="w-full"
          contentContainerStyle={{ flexGrow: 1, alignItems: "center" }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          <View
            className="w-full flex-1"
            style={{
              maxWidth: Platform.OS === "web" ? 460 : undefined,
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.lg,
              paddingBottom: spacing.xl,
            }}
          >
            <View className="min-h-12 flex-row items-center justify-between">
              {topAction ?? <View />}
              <ThemedText className="uppercase tracking-widest" variant="caption">{step}</ThemedText>
            </View>

            <View className="mt-10 flex-row items-end justify-between gap-2">
              <View className="flex-1 items-start">
                <ThemedText numberOfLines={1} variant={headlineVariant}>{title}</ThemedText>
                <View className="border-2 border-ink bg-brand px-2">
                  <ThemedText numberOfLines={1} variant={headlineVariant}>{highlight}</ThemedText>
                </View>
              </View>
              <DotMotif />
            </View>
            <ThemedText className="mt-4" variant="body">{subtitle}</ThemedText>

            <View className="mt-10 gap-5">{children}</View>
            <View className="mt-auto pt-12">{footer}</View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
