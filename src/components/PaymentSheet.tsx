import {
  BottomSheet,
  BottomSheetScrollView,
  BottomSheetView,
} from "@expo/ui/community/bottom-sheet";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PaymentForm } from "@/components/PaymentForm";
import { ThemedText } from "@/components/ThemedText";
import { colors, spacing } from "@/theme";
import type { Payment } from "@/types";

const SNAP_POINTS = ["60%", "90%"];

type PaymentSheetProps = {
  visible: boolean;
  subscriptionId: string;
  /** Present when editing an existing payment; absent when recording a new one. */
  payment?: Payment;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

export function PaymentSheet({
  visible,
  subscriptionId,
  payment,
  onClose,
  onSaved,
}: PaymentSheetProps) {
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
            <ThemedText variant="heading">{payment ? "Edit payment" : "Record payment"}</ThemedText>
            <ThemedText>Enter the amount and the date it was paid.</ThemedText>
          </View>
          <BottomSheetScrollView
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: spacing.xs }}
          >
            {visible ? (
              <PaymentForm
                key={payment?.id ?? "new-payment"}
                onCancel={onClose}
                onSaved={onSaved}
                payment={payment}
                subscriptionId={subscriptionId}
              />
            ) : null}
          </BottomSheetScrollView>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
