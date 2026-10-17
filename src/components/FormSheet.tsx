import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { cardRadius, colors, spacing } from "@/theme";

type FormSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  /** Largest share of the screen the sheet may take. Shorter content opens a shorter sheet. */
  maxHeightRatio?: number;
  children: ReactNode;
};

/**
 * Shared chrome for quick-entry bottom sheets: handle, title, description, scrollable body.
 * Rendered by @gorhom/bottom-sheet as plain React Native views, so buttons inside receive touches
 * like any other screen content (the native sheet presentation did not reliably deliver them).
 */
export function FormSheet({
  visible,
  onClose,
  title,
  description,
  maxHeightRatio = 0.9,
  children,
}: FormSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetRef = useRef<BottomSheetModal>(null);
  // True from present() until onDismiss, so the sheet is presented and dismissed exactly once.
  const isPresentedRef = useRef(false);

  useEffect(() => {
    if (visible && !isPresentedRef.current) {
      isPresentedRef.current = true;
      sheetRef.current?.present();
    } else if (!visible && isPresentedRef.current) {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  // Fires after the close animation, for swipe-down, backdrop tap, and programmatic dismissal.
  const handleDismiss = useCallback(() => {
    isPresentedRef.current = false;
    onClose();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  const cornerRadii = { borderTopLeftRadius: cardRadius, borderTopRightRadius: cardRadius };

  return (
    <BottomSheetModal
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.canvas, ...cornerRadii }}
      enableDynamicSizing
      enablePanDownToClose
      handleComponent={null}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      maxDynamicContentSize={windowHeight * maxHeightRatio}
      onDismiss={handleDismiss}
      ref={sheetRef}
    >
      {/* flex: 1 lets the scroll view fill the sheet height that dynamic sizing resolves to. */}
      <BottomSheetView style={{ flex: 1, backgroundColor: colors.canvas, overflow: "hidden", ...cornerRadii }}>
        <BottomSheetScrollView
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          {/* Everything lives inside the scroll view so dynamic sizing measures the whole sheet. */}
          <View
            className="gap-4 px-4 pt-3"
            style={{ paddingBottom: Math.max(insets.bottom, spacing.md) }}
          >
            <View className="items-center py-1">
              <View className="h-1.5 w-10 rounded-pill bg-neutral" />
            </View>
            <View className="gap-1">
              <ThemedText variant="heading">{title}</ThemedText>
              <ThemedText>{description}</ThemedText>
            </View>
            {children}
          </View>
        </BottomSheetScrollView>
      </BottomSheetView>
    </BottomSheetModal>
  );
}
