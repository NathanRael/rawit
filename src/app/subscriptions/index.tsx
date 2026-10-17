import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { AppScreenFrame } from "@/components/AppScreenFrame";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { FilterChip } from "@/components/FilterChip";
import { IconButton } from "@/components/IconButton";
import { PeriodListItem } from "@/components/PeriodListItem";
import {
  SubscriptionPeriodFilterSheet,
  type AdvancedPeriodFilters,
  type PeriodSubscriberOption,
} from "@/components/SubscriptionPeriodFilterSheet";
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
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedPeriodFilters>({
    subscriberId: null,
    expirationFrom: null,
    expirationTo: null,
  });
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);
  const [filterSheetSession, setFilterSheetSession] = useState(0);
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
      });
      if (currentRequest === requestId.current) setPeriods(results);
    } catch (cause) {
      if (currentRequest === requestId.current) {
        setError(cause instanceof Error ? cause.message : "Could not load subscription periods.");
      }
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false);
    }
  }, [asOfDate]);

  useFocusEffect(
    useCallback(() => {
      void loadPeriods();
      return () => {
        requestId.current += 1;
      };
    }, [loadPeriods]),
  );

  const subscribers = useMemo<PeriodSubscriberOption[]>(() => {
    const uniqueSubscribers = new Map<string, PeriodSubscriberOption>();
    for (const period of periods) {
      uniqueSubscribers.set(period.subscriberId, {
        id: period.subscriberId,
        name: period.subscriberName,
      });
    }
    return [...uniqueSubscribers.values()].sort((first, second) =>
      first.name.localeCompare(second.name),
    );
  }, [periods]);

  const visiblePeriods = useMemo(
    () =>
      periods.filter((period) => {
        if (filter === "active" && period.lifecycleStatus !== "active") return false;
        if (filter === "expiring_soon" && period.lifecycleStatus !== "expiring_soon") return false;
        if (filter === "expired" && period.lifecycleStatus !== "expired") return false;
        if (filter === "unpaid" && period.paymentStatus === "paid") return false;
        if (advancedFilters.subscriberId && period.subscriberId !== advancedFilters.subscriberId) {
          return false;
        }
        if (
          advancedFilters.expirationFrom &&
          period.expirationDate < advancedFilters.expirationFrom
        ) {
          return false;
        }
        if (advancedFilters.expirationTo && period.expirationDate > advancedFilters.expirationTo) {
          return false;
        }
        return true;
      }),
    [advancedFilters, filter, periods],
  );

  const activeAdvancedFilterCount =
    Number(advancedFilters.subscriberId !== null) +
    Number(advancedFilters.expirationFrom !== null);
  const hasActiveFilters = filter !== "all" || activeAdvancedFilterCount > 0;

  const clearAllFilters = () => {
    setFilter("all");
    setAdvancedFilters({ subscriberId: null, expirationFrom: null, expirationTo: null });
  };

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
        <View className="flex-row items-center justify-between">
          <ThemedText variant="label">Filter periods</ThemedText>
          <IconButton
            icon="filter"
            label={
              activeAdvancedFilterCount > 0
                ? `Advanced filters, ${activeAdvancedFilterCount} applied`
                : "Advanced filters"
            }
            onPress={() => {
              setFilterSheetSession((session) => session + 1);
              setIsFilterSheetVisible(true);
            }}
            variant={activeAdvancedFilterCount > 0 ? "primary" : "secondary"}
          />
        </View>
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
        {activeAdvancedFilterCount > 0 ? (
          <ThemedText variant="caption">
            {activeAdvancedFilterCount} advanced filter{activeAdvancedFilterCount === 1 ? "" : "s"} applied
          </ThemedText>
        ) : null}
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
      ) : visiblePeriods.length === 0 ? (
        <EmptyState
          action={
            !hasActiveFilters
              ? {
                  label: "Add a period",
                  onPress: () => setIsAddSheetVisible(true),
                  accessibilityHint: "Create a subscription period",
                }
              : { label: "Clear filters", onPress: clearAllFilters }
          }
          description={
            !hasActiveFilters
              ? "Create a period to track a subscriber’s network access, expiration, and amount due."
              : "No periods match these filters. Clear them to see all periods."
          }
          icon="plans"
          title={!hasActiveFilters ? "No periods yet" : "No matching periods"}
        />
      ) : (
        <View className="gap-3">
          {visiblePeriods.map((period) => (
            <PeriodListItem
              key={period.id}
              onPress={() => router.push(subscriptionDetailsHref(period.id))}
              period={period}
            />
          ))}
        </View>
      )}
      <SubscriptionPeriodFilterSheet
        key={filterSheetSession}
        filters={advancedFilters}
        onApply={(nextFilters) => {
          setAdvancedFilters(nextFilters);
          setIsFilterSheetVisible(false);
        }}
        onClose={() => setIsFilterSheetVisible(false)}
        subscribers={subscribers}
        visible={isFilterSheetVisible}
      />
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
