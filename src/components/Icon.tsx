import { SymbolView, type SymbolViewProps } from "expo-symbols";

import { colors } from "@/theme";

export const iconNames = {
  wifi: { ios: "wifi", android: "wifi", web: "wifi" },
  home: { ios: "house.fill", android: "home", web: "home" },
  plans: { ios: "rectangle.stack.fill", android: "receipt_long", web: "receipt_long" },
  people: { ios: "person.2.fill", android: "group", web: "group" },
  more: { ios: "ellipsis", android: "more_horiz", web: "more_horiz" },
  overflow: { ios: "ellipsis.circle", android: "more_vert", web: "more_vert" },
  back: { ios: "chevron.left", android: "arrow_back", web: "arrow_back" },
  chevron: { ios: "chevron.right", android: "chevron_right", web: "chevron_right" },
  search: { ios: "magnifyingglass", android: "search", web: "search" },
  plus: { ios: "plus", android: "add", web: "add" },
  check: { ios: "checkmark", android: "check", web: "check" },
  calendar: { ios: "calendar", android: "calendar_month", web: "calendar_month" },
  chart: { ios: "chart.bar.fill", android: "bar_chart", web: "bar_chart" },
  bell: { ios: "bell.fill", android: "notifications", web: "notifications" },
  settings: { ios: "gearshape.fill", android: "settings", web: "settings" },
  person: { ios: "person.crop.circle", android: "person", web: "person" },
  warning: { ios: "exclamationmark.triangle", android: "warning", web: "warning" },
  success: { ios: "checkmark.circle", android: "check_circle", web: "check_circle" },
  arrow: { ios: "arrow.up.right", android: "north_east", web: "north_east" },
} as const satisfies Record<string, SymbolViewProps["name"]>;

export type IconName = keyof typeof iconNames;

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
};

export function Icon({ name, size = 20, color = colors.ink }: IconProps) {
  return (
    <SymbolView
      name={iconNames[name]}
      size={size}
      tintColor={color}
      weight="bold"
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
