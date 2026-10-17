import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { AppScreenFrame } from "@/components/AppScreenFrame";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { FilterChip } from "@/components/FilterChip";
import { PeriodListItem } from "@/components/PeriodListItem";
import { SubscriptionPeriodSheet } from "@/components/SubscriptionPeriodSheet";
import { ThemedText } from "@/components/ThemedText";
import { listSubscriptionPeriods } from "@/lib/database/repositories";
import { subscriptionDetailsHref } from "@/lib/navigation";
import { useLifecycleDate } from "@/store/lifecycle";
import type { SubscriptionPeriodDetails } from "@/types";

type PeriodFilter = "all" | "active" | "expiring_soon" | "expired" | "unpaid";

const filters: { label: string; value: PeriodFilter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Expiring soon", value: "expiring_soon" },
  { label: "Expired", value: "expired" },
  { label: "Unpaid", value: "unpaid" },
];

export default function SubscriptionPeriodsScreen() {
  const router = useRouter();
  const asOfDate = useLifecycleDate();
  const [periods, setPeriods] = useState<SubscriptionPeriodDetails[]>([]);
  const [filter, setFilter] = useState<PeriodFilter>("all");
  const [isAddSheetVisible, setIsAddSheetVisible] = useState(false);
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
        onPress={() => setIsAddSheetVisible(true)}
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
                  onPress: () => setIsAddSheetVisible(true),
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
        <View className="gap-3">
          {periods.map((period) => (
            <PeriodListItem
              key={period.id}
              onPress={() => router.push(subscriptionDetailsHref(period.id))}
              period={period}
            />
          ))}
        </View>
      )}
      <SubscriptionPeriodSheet
        onClose={() => setIsAddSheetVisible(false)}
        onSaved={(periodId) => {
          setIsAddSheetVisible(false);
          router.push(subscriptionDetailsHref(periodId));
        }}
        visible={isAddSheetVisible}
      />
    </AppScreenFrame>
  );
}
