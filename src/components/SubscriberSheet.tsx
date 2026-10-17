import {
  BottomSheet,
  BottomSheetScrollView,
  BottomSheetView,
} from "@expo/ui/community/bottom-sheet";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SubscriberForm } from "@/components/SubscriberForm";
import { ThemedText } from "@/components/ThemedText";
import { colors, spacing } from "@/theme";

const SNAP_POINTS = ["50%", "90%"];

type SubscriberSheetProps = {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export function SubscriberSheet({ visible, onClose, onCreated }: SubscriberSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <BottomSheet
      backgroundStyle={{ backgroundColor: colors.canvas }}
      enablePanDownToClose
      handleComponent={null}
      index={visible ? 0 : -1}
      onClose={onClose}
      snapPoints={SNAP_POINTS}
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
            <ThemedText variant="heading">Add subscriber</ThemedText>
            <ThemedText>Drag the handle up to expand, or down to close.</ThemedText>
          </View>
          <BottomSheetScrollView
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: spacing.xs }}
          >
            <SubscriberForm embedded onCancel={onClose} onCreated={onCreated} />
          </BottomSheetScrollView>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
