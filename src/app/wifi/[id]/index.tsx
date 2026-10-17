import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { AppScreenFrame } from "@/components/AppScreenFrame";
import {
  deleteWifiNetwork,
  getWifiNetworkById,
  getWifiNetworkSubscriptionCount,
} from "@/lib/database/repositories";
import { wifiNetworksHref } from "@/lib/navigation";
import type { WifiNetwork } from "@/types";

export default function WifiNetworkDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const networkId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const [network, setNetwork] = useState<WifiNetwork | null>(null);
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNetwork = useCallback(async () => {
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
  }, [networkId]);

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

  return (
    <AppScreenFrame subtitle="View and manage the saved network details." title="Network details">
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
          <Card className="gap-4">
            <ThemedText variant="heading">{network.name}</ThemedText>
            <View className="gap-1">
              <ThemedText variant="label">SSID</ThemedText>
              <ThemedText>{network.ssid ?? "Not provided"}</ThemedText>
            </View>
            <View className="gap-1">
              <ThemedText variant="label">Notes</ThemedText>
              <ThemedText>{network.notes ?? "No notes added."}</ThemedText>
            </View>
            <View className="gap-1">
              <ThemedText variant="label">Subscription history</ThemedText>
              <ThemedText>
                {subscriptionCount === 0
                  ? "No linked subscriptions"
                  : `${subscriptionCount} linked subscription${subscriptionCount === 1 ? "" : "s"}`}
              </ThemedText>
            </View>
          </Card>
          {error ? <ThemedText accessibilityRole="alert">{error}</ThemedText> : null}
          <Button
            onPress={() => router.push({ pathname: "/wifi/[id]/edit", params: { id: network.id } })}
            title="Edit network"
            accessibilityHint="Change this network's name, SSID, or notes"
          />
          {subscriptionCount > 0 ? (
            <View className="gap-2">
              <Button
                disabled
                onPress={requestDelete}
                title="Delete network"
                variant="danger"
              />
              <ThemedText>
                A network with subscription history cannot be deleted. The history remains linked to
                this network.
              </ThemedText>
            </View>
          ) : (
            <Button onPress={requestDelete} title="Delete network" variant="danger" />
          )}
        </View>
      ) : null}
    </AppScreenFrame>
  );
}
