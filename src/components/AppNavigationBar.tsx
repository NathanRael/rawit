import { usePathname, type Href } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomNavbar, type NavbarItem } from "@/components/BottomNavbar";
import { overviewHref, subscribersHref, subscriptionsHref, wifiNetworksHref } from "@/lib/navigation";
import { spacing } from "@/theme";

type NavigationItem = NavbarItem & {
  href: Href;
  pathname: string;
};

type AppNavigationBarProps = {
  onNavigate: (href: Href, pathname: string) => void;
};

const navigationItems: NavigationItem[] = [
  { key: "home", label: "Home", icon: "home", href: overviewHref, pathname: "/" },
  { key: "periods", label: "Periods", icon: "plans", href: subscriptionsHref, pathname: "/subscriptions" },
  { key: "wifi", label: "WiFi", icon: "wifi", href: wifiNetworksHref, pathname: "/wifi" },
  { key: "people", label: "People", icon: "people", href: subscribersHref, pathname: "/subscribers" },
];

function normalizePathname(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

function getActiveIndex(pathname: string): number {
  const normalizedPathname = normalizePathname(pathname);
  const matchingIndex = navigationItems.findIndex(
    (item) =>
      normalizedPathname === item.pathname ||
      (item.pathname !== "/" && normalizedPathname.startsWith(`${item.pathname}/`)),
  );

  // Non-tab routes such as Settings keep Home selected, matching the existing navbar behavior.
  return matchingIndex === -1 ? 0 : matchingIndex;
}

export function AppNavigationBar({ onNavigate }: AppNavigationBarProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const activeIndex = getActiveIndex(pathname);

  const handleChange = (key: string) => {
    const destination = navigationItems.find((item) => item.key === key);
    if (!destination) return;

    // The root cancels a not-yet-dispatched request when the destination is already on screen.
    onNavigate(destination.href, destination.pathname);
  };

  return (
    <View
      className="bg-canvas px-4 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, spacing.md) }}
    >
      <BottomNavbar
        activeKey={navigationItems[activeIndex].key}
        items={navigationItems}
        onChange={handleChange}
      />
    </View>
  );
}
