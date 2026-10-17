import { useRef, useState } from "react";
import { Pressable, View } from "react-native";

import { Button } from "@/components/Button";
import { FormSheet } from "@/components/FormSheet";
import { Icon } from "@/components/Icon";
import { hardShadow, roundedCorners } from "@/theme";

export type OverflowMenuItem = {
  key: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

type OverflowMenuProps = {
  /** Accessible name for the trigger button; also shown as the menu title. */
  label: string;
  items: OverflowMenuItem[];
};

/** Three-dot menu for secondary actions, presented in the app's shared bottom-sheet style. */
export function OverflowMenu({ label, items }: OverflowMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  // The chosen action runs only after the sheet reports it has closed. Starting another sheet or
  // an alert while this native sheet is still dismissing is silently rejected by iOS and Android.
  const pendingActionRef = useRef<OverflowMenuItem | null>(null);

  const close = () => setIsOpen(false);

  const choose = (item: OverflowMenuItem) => {
    if (item.disabled) return;
    pendingActionRef.current = item;
    close();
  };

  const handleClosed = () => {
    const item = pendingActionRef.current;
    pendingActionRef.current = null;
    setIsOpen(false);
    item?.onPress();
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: isOpen }}
        className="h-12 w-12 items-center justify-center rounded-control border-2 border-ink bg-white"
        onPress={() => setIsOpen(true)}
        style={({ pressed }) => [
          hardShadow(pressed),
          roundedCorners,
          { transform: pressed ? [{ translateX: 2 }, { translateY: 2 }] : undefined },
        ]}
      >
        <Icon name="overflow" />
      </Pressable>

      <FormSheet
        description="Choose an action below."
        onClose={handleClosed}
        title={label}
        visible={isOpen}
      >
        <View className="gap-3">
          {items.map((item) => (
            <Button
              disabled={item.disabled}
              key={item.key}
              onPress={() => choose(item)}
              title={item.label}
              variant={item.destructive ? "danger" : "secondary"}
            />
          ))}
          <Button onPress={close} title="Close" variant="primary" />
        </View>
      </FormSheet>
    </>
  );
}
