import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { AppScreenFrame } from "@/components/AppScreenFrame";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { FilterChip } from "@/components/FilterChip";
import { ThemedText } from "@/components/ThemedText";
import { listSubscriptionPeriods } from "@/lib/database/repositories";
import { formatCurrency, formatDateLocal } from "@/lib/dates";
import { newSubscriptionHref, subscriptionDetailsHref } from "@/lib/navigation";
import { useLifecycleDate } from "@/store/lifecycle";
import type { SubscriptionLifecycleStatus, SubscriptionPeriodDetails } from "@/types";

type PeriodFilter = "all" | "active" | "expiring_soon" | "expired" | "unpaid";

const filters: { label: string; value: PeriodFilter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Expiring soon", value: "expiring_soon" },
  { label: "Expired", value: "expired" },
  { label: "Unpaid", value: "unpaid" },
];

function lifecycleLabel(status: SubscriptionLifecycleStatus): string {
  if (status === "expiring_soon") return "Expiring soon";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function paymentLabel(status: SubscriptionPeriodDetails["paymentStatus"]): string {
  if (status === "partially_paid") return "Partially paid";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function SubscriptionPeriodsScreen() {
  const router = useRouter();
  const asOfDate = useLifecycleDate();
  const [periods, setPeriods] = useState<SubscriptionPeriodDetails[]>([]);
  const [filter, setFilter] = useState<PeriodFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const loadPeriods = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const results = await listSubscriptionPeriods({
        asOfDate,
        lifecycleStatus:
          filter === "active" || filter === "expiring_soon" || filter === "expired"
            ? filter
            : undefined,
        unpaidOnly: filter === "unpaid",
      });
      if (currentRequest === requestId.current) setPeriods(results);
    } catch (cause) {
      if (currentRequest === requestId.current) {
        setError(cause instanceof Error ? cause.message : "Could not load subscription periods.");
      }
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false);
    }
  }, [asOfDate, filter]);

  useFocusEffect(
    useCallback(() => {
      void loadPeriods();
      return () => {
        requestId.current += 1;
      };
    }, [loadPeriods]),
  );

  return (
    <AppScreenFrame
      onRefresh={() => void loadPeriods()}
      refreshing={isLoading}
      subtitle="Review each subscriber’s network period, lifecycle, and payment status."
      title="Subscription periods"
    >
      <Button
        onPress={() => router.push(newSubscriptionHref)}
        title="Add a period"
        accessibilityHint="Create a subscription period for a subscriber and WiFi network"
      />

      <View className="gap-2">
        <ThemedText variant="label">Filter periods</ThemedText>
        <View className="flex-row flex-wrap gap-2">
          {filters.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              onPress={() => setFilter(option.value)}
              selected={filter === option.value}
            />
          ))}
        </View>
      </View>

      {isLoading ? (
        <View className="items-center gap-3 py-8">
          <ActivityIndicator accessibilityLabel="Loading subscription periods" />
          <ThemedText accessibilityLiveRegion="polite">Loading periods…</ThemedText>
        </View>
      ) : error ? (
        <Card className="gap-4">
          <ThemedText accessibilityRole="alert">Subscription periods could not be loaded.</ThemedText>
          <ThemedText>{error}</ThemedText>
          <Button onPress={() => void loadPeriods()} title="Try again" variant="secondary" />
        </Card>
      ) : periods.length === 0 ? (
        <EmptyState
          action={
            filter === "all"
              ? {
                  label: "Add a period",
                  onPress: () => router.push(newSubscriptionHref),
                  accessibilityHint: "Create a subscription period",
                }
              : { label: "Show all periods", onPress: () => setFilter("all") }
          }
          description={
            filter === "all"
              ? "Create a period to track a subscriber’s network access, expiration, and amount due."
              : "No periods match this filter. Try another status or show all periods."
          }
          icon="plans"
          title={filter === "all" ? "No periods yet" : "No matching periods"}
        />
      ) : (
        <View className="gap-4">
          {periods.map((period) => (
            <Pressable
              accessibilityHint="Open subscription period details"
              accessibilityLabel={`${period.subscriberName} on ${period.wifiNetworkName}, expires ${formatDateLocal(period.expirationDate)}, ${lifecycleLabel(period.lifecycleStatus)}, ${paymentLabel(period.paymentStatus)}`}
              accessibilityRole="button"
              className="min-h-11"
              key={period.id}
              onPress={() => router.push(subscriptionDetailsHref(period.id))}
            >
              <Card className="gap-2">
                <ThemedText variant="label">{period.subscriberName}</ThemedText>
                <ThemedText>{period.wifiNetworkName}</ThemedText>
                <ThemedText variant="caption">
                  {formatDateLocal(period.startDate)} – {formatDateLocal(period.expirationDate)}
                </ThemedText>
                <ThemedText>Amount · {formatCurrency(period.amount)}</ThemedText>
                <ThemedText>Lifecycle · {lifecycleLabel(period.lifecycleStatus)}</ThemedText>
                <ThemedText>Payment · {paymentLabel(period.paymentStatus)}</ThemedText>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </AppScreenFrame>
  );
}
