import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { ThemedText } from "@/components/ThemedText";
import { WifiNetworkSheet } from "@/components/WifiNetworkSheet";
import { AppScreenFrame } from "@/components/AppScreenFrame";
import { listWifiNetworks } from "@/lib/database/repositories";
import { wifiNetworkDetailsHref } from "@/lib/navigation";
import type { WifiNetwork } from "@/types";

export default function WifiNetworksScreen() {
  const router = useRouter();
  const [networks, setNetworks] = useState<WifiNetwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddSheetVisible, setIsAddSheetVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNetworks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setNetworks(await listWifiNetworks());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load WiFi networks.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadNetworks();
    }, [loadNetworks]),
  );

  return (
    <AppScreenFrame
      onRefresh={() => void loadNetworks()}
      refreshing={isLoading}
      subtitle="Keep the networks you manage together in one place."
      title="WiFi networks"
    >
      {isLoading || error || networks.length > 0 ? (
        <Button
          onPress={() => setIsAddSheetVisible(true)}
          title="Add a network"
          accessibilityHint="Create a WiFi network record"
        />
      ) : null}
      {isLoading ? (
        <View className="items-center gap-3 py-8">
          <ActivityIndicator accessibilityLabel="Loading WiFi networks" />
          <ThemedText accessibilityLiveRegion="polite">Loading networks…</ThemedText>
        </View>
      ) : error ? (
        <Card className="gap-4">
          <ThemedText accessibilityRole="alert">Networks could not be loaded.</ThemedText>
          <ThemedText>{error}</ThemedText>
          <Button onPress={() => void loadNetworks()} title="Try again" variant="secondary" />
        </Card>
      ) : networks.length === 0 ? (
        <EmptyState
          action={{
            label: "Add a network",
            onPress: () => setIsAddSheetVisible(true),
            accessibilityHint: "Open the add WiFi network sheet",
          }}
          description="Add your first network to keep its name, SSID, and notes ready for future subscriptions."
          icon="wifi"
          title="No WiFi networks yet"
        />
      ) : (
        <View className="gap-4">
          {networks.map((network) => (
            <Pressable
              accessibilityHint="Open network details"
              accessibilityLabel={`${network.name}${network.ssid ? `, SSID ${network.ssid}` : ""}`}
              accessibilityRole="button"
              key={network.id}
              onPress={() => router.push(wifiNetworkDetailsHref(network.id))}
              className="min-h-11"
            >
              <Card className="gap-2">
                <ThemedText variant="label">{network.name}</ThemedText>
                <ThemedText variant="caption">
                  {network.ssid ? `SSID · ${network.ssid}` : "SSID not provided"}
                </ThemedText>
                {network.notes ? <ThemedText numberOfLines={2}>{network.notes}</ThemedText> : null}
              </Card>
            </Pressable>
          ))}
        </View>
      )}
      <WifiNetworkSheet
        onClose={() => setIsAddSheetVisible(false)}
        onCreated={() => {
          setIsAddSheetVisible(false);
          void loadNetworks();
        }}
        visible={isAddSheetVisible}
      />
    </AppScreenFrame>
  );
}
