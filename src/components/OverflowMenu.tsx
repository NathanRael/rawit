import { MenuView, type MenuAction } from "@expo/ui/community/menu";
import { useMemo } from "react";
import { View } from "react-native";

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
  /** Accessible name for the trigger button. */
  label: string;
  items: OverflowMenuItem[];
};

/** Three-dot menu that groups secondary actions. Uses the native menu on iOS and Android. */
export function OverflowMenu({ label, items }: OverflowMenuProps) {
  const actions = useMemo<MenuAction[]>(
    () =>
      items.map((item) => ({
        id: item.key,
        title: item.label,
        attributes: {
          destructive: item.destructive,
          disabled: item.disabled,
        },
      })),
    [items],
  );

  return (
    <MenuView
      actions={actions}
      onPressAction={({ nativeEvent }) => {
        const selected = items.find((item) => item.key === nativeEvent.event);
        if (selected && !selected.disabled) selected.onPress();
      }}
    >
      <View
        accessibilityRole="button"
        accessibilityLabel={label}
        className="h-12 w-12 items-center justify-center rounded-control border-2 border-ink bg-white"
        style={[hardShadow(), roundedCorners]}
      >
        <Icon name="overflow" />
      </View>
    </MenuView>
  );
}
