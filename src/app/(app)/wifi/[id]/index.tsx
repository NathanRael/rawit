import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { AppScreenFrame } from "@/components/AppScreenFrame";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DetailDivider, DetailRow } from "@/components/DetailRow";
import { OverflowMenu, type OverflowMenuItem } from "@/components/OverflowMenu";
import { ThemedText } from "@/components/ThemedText";
import { WifiNetworkSheet } from "@/components/WifiNetworkSheet";
import {
  deleteWifiNetwork,
  getWifiNetworkById,
  getWifiNetworkSubscriptionCount,
} from "@/lib/database/repositories";
import { wifiNetworksHref } from "@/lib/navigation";
import { useSyncStore } from "@/store/sync";
import type { WifiNetwork } from "@/types";

export default function WifiNetworkDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const networkId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const dataVersion = useSyncStore((state) => state.dataVersion);
  const [network, setNetwork] = useState<WifiNetwork | null>(null);
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditSheetVisible, setIsEditSheetVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(wifiNetworksHref);
  };

  const loadNetwork = useCallback(async () => {
    if (dataVersion !== useSyncStore.getState().dataVersion) return;
    if (!networkId) {
      setError("A network ID is required to view this WiFi network.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [record, linkedCount] = await Promise.all([
        getWifiNetworkById(networkId),
        getWifiNetworkSubscriptionCount(networkId),
      ]);
      setNetwork(record);
      setSubscriptionCount(linkedCount);
      if (!record) setError("This WiFi network could not be found. It may have been removed.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load this WiFi network.");
    } finally {
      setIsLoading(false);
    }
  }, [dataVersion, networkId]);

  useFocusEffect(
    useCallback(() => {
      void loadNetwork();
    }, [loadNetwork]),
  );

  const requestDelete = () => {
    if (!network) return;
    Alert.alert(
      "Delete WiFi network?",
      `Delete “${network.name}”? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void confirmDelete(),
        },
      ],
    );
  };

  const confirmDelete = async () => {
    if (!networkId) return;
    setError(null);
    try {
      const result = await deleteWifiNetwork(networkId);
      if (result.deleted) {
        router.replace(wifiNetworksHref);
      } else if (result.reason === "has_subscriptions") {
        setSubscriptionCount(result.subscriptionCount);
        setError(
          `This network has ${result.subscriptionCount} linked subscription${result.subscriptionCount === 1 ? "" : "s"} and cannot be deleted.`,
        );
      } else {
        setNetwork(null);
        setError("This WiFi network no longer exists.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this WiFi network.");
    }
  };

  const menuItems: OverflowMenuItem[] = network
    ? [
        {
          key: "edit",
          label: "Edit network",
          onPress: () => setIsEditSheetVisible(true),
        },
        {
          key: "delete",
          label: "Delete network",
          onPress: requestDelete,
          destructive: true,
          disabled: subscriptionCount > 0,
        },
      ]
    : [];

  return (
    <AppScreenFrame
      headerAction={network ? <OverflowMenu items={menuItems} label="More network actions" /> : null}
      onBack={goBack}
      subtitle="View and manage the saved network details."
      title="Network details"
    >
      {isLoading ? (
        <View className="items-center gap-3 py-8">
          <ActivityIndicator accessibilityLabel="Loading network details" />
          <ThemedText accessibilityLiveRegion="polite">Loading network…</ThemedText>
        </View>
      ) : error && !network ? (
        <Card className="gap-4">
          <ThemedText accessibilityRole="alert">Network unavailable</ThemedText>
          <ThemedText>{error}</ThemedText>
          <Button onPress={() => void loadNetwork()} title="Try again" variant="secondary" />
        </Card>
      ) : network ? (
        <View className="gap-5">
          <Card className="gap-3">
            <ThemedText variant="heading">{network.name}</ThemedText>
            <DetailRow label="SSID" value={network.ssid ?? "Not provided"} />
            <DetailDivider />
            <DetailRow
              label="History"
              value={
                subscriptionCount === 0
                  ? "No linked subscriptions"
                  : `${subscriptionCount} linked subscription${subscriptionCount === 1 ? "" : "s"}`
              }
            />
          </Card>

          <Card className="gap-2">
            <ThemedText variant="label">Notes</ThemedText>
            <ThemedText>{network.notes ?? "No notes added."}</ThemedText>
          </Card>

          {error ? <ThemedText accessibilityRole="alert">{error}</ThemedText> : null}
          {subscriptionCount > 0 ? (
            <ThemedText variant="caption">
              A network with subscription history cannot be deleted. The history remains linked to
              this network.
            </ThemedText>
          ) : null}
        </View>
      ) : null}
      <WifiNetworkSheet
        networkId={network?.id}
        onClose={() => setIsEditSheetVisible(false)}
        onSaved={() => {
          setIsEditSheetVisible(false);
          void loadNetwork();
        }}
        visible={isEditSheetVisible}
      />
    </AppScreenFrame>
  );
}
