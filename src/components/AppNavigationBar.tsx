import { usePathname, type Href } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomNavbar, type NavbarItem } from "@/components/BottomNavbar";
import { subscribersHref, subscriptionsHref, wifiNetworksHref } from "@/lib/navigation";
import { spacing } from "@/theme";

export type TabNavigationDirection = "push" | "pop";

type NavigationItem = NavbarItem & {
  href: Href;
  pathname: string;
};

type AppNavigationBarProps = {
  onNavigate: (
    href: Href,
    pathname: string,
    direction: TabNavigationDirection | undefined,
  ) => void;
};

const navigationItems: NavigationItem[] = [
  { key: "home", label: "Home", icon: "home", href: "/", pathname: "/" },
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
    const destinationIndex = navigationItems.findIndex((item) => item.key === key);
    const destination = navigationItems[destinationIndex];
    if (!destination) return;

    const currentPathname = normalizePathname(pathname);
    if (currentPathname === destination.pathname) {
      // Let the root cancel a not-yet-dispatched tab request if the user returns
      // to the route that is still on screen.
      onNavigate(destination.href, destination.pathname, undefined);
      return;
    }

    const direction =
      destinationIndex > activeIndex ? "push" : destinationIndex < activeIndex ? "pop" : undefined;

    onNavigate(destination.href, destination.pathname, direction);
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
