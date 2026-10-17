import {
  BottomSheet,
  BottomSheetScrollView,
  BottomSheetView,
} from "@expo/ui/community/bottom-sheet";
import type { ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { colors, spacing } from "@/theme";

type FormSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  snapPoints: string[];
  children: ReactNode;
};

/** Shared chrome for quick-entry bottom sheets: handle, title, description, scrollable body. */
export function FormSheet({
  visible,
  onClose,
  title,
  description,
  snapPoints,
  children,
}: FormSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <BottomSheet
      backgroundStyle={{ backgroundColor: colors.canvas }}
      enablePanDownToClose
      handleComponent={null}
      index={visible ? 0 : -1}
      onClose={onClose}
      snapPoints={snapPoints}
    >
      <BottomSheetView style={{ flex: 1, backgroundColor: colors.canvas }}>
        <View
          className="flex-1 gap-4 bg-canvas px-4 pt-3"
          style={{
            backgroundColor: colors.canvas,
            paddingBottom: Math.max(insets.bottom, spacing.md),
          }}
        >
          <View className="items-center py-1">
            <View className="h-1.5 w-10 rounded-pill bg-neutral" />
          </View>
          <View className="gap-1">
            <ThemedText variant="heading">{title}</ThemedText>
            <ThemedText>{description}</ThemedText>
          </View>
          <BottomSheetScrollView
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: spacing.xs }}
          >
            {children}
          </BottomSheetScrollView>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
