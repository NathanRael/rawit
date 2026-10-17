import { Pressable, View, type ViewStyle } from "react-native";

import { Icon, type IconName } from "@/components/Icon";
import { ThemedText } from "@/components/ThemedText";
import { colors, hardShadow } from "@/theme";

export type NavbarItem = {
  key: string;
  label: string;
  icon: IconName;
};

type BottomNavbarProps = {
  items: NavbarItem[];
  activeKey: string;
  onChange: (key: string) => void;
  style?: ViewStyle;
};

export function BottomNavbar({ items, activeKey, onChange, style }: BottomNavbarProps) {
  return (
    <View
      accessibilityRole="tablist"
      className="flex-row items-center justify-around gap-1 rounded-pill border-2 border-ink bg-charcoal p-2"
      style={[hardShadow(), style]}
    >
      {items.map((item) => {
        const active = item.key === activeKey;

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            className={`min-h-12 min-w-12 flex-1 flex-row items-center justify-center gap-2 rounded-pill px-2 ${active ? "bg-brand" : "bg-charcoal"}`}
            key={item.key}
            onPress={() => onChange(item.key)}
            style={({ pressed }) => ({
              transform: pressed ? [{ translateX: 2 }, { translateY: 2 }] : undefined,
            })}
          >
            <Icon color={active ? colors.ink : colors.white} name={item.icon} size={20} />
            {active ? (
              <ThemedText className="text-ink" numberOfLines={1} variant="caption">
                {item.label}
              </ThemedText>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
