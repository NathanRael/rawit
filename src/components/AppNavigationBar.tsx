import { usePathname, useRouter } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomNavbar, type NavbarItem } from "@/components/BottomNavbar";
import { subscribersHref, wifiNetworksHref } from "@/lib/navigation";
import { spacing } from "@/theme";

const navigationItems: NavbarItem[] = [
  { key: "home", label: "Home", icon: "home" },
  { key: "wifi", label: "WiFi", icon: "wifi" },
  { key: "people", label: "People", icon: "people" },
];

export function AppNavigationBar() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeKey = pathname.startsWith("/wifi")
    ? "wifi"
    : pathname.startsWith("/subscribers")
      ? "people"
      : "home";

  return (
    <View
      className="bg-canvas px-4 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, spacing.md) }}
    >
      <BottomNavbar
        activeKey={activeKey}
        items={navigationItems}
        onChange={(key) => {
          if (key === "wifi") router.replace(wifiNetworksHref);
          else if (key === "people") router.replace(subscribersHref);
          else router.replace("/");
        }}
      />
    </View>
  );
}
