import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Pressable, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { AppScreenFrame } from "@/components/AppScreenFrame";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { IconButton } from "@/components/IconButton";
import { PeriodListItem } from "@/components/PeriodListItem";
import { SubscriptionPeriodSheet } from "@/components/SubscriptionPeriodSheet";
import { ThemedText } from "@/components/ThemedText";
import { listSubscriptionPeriods } from "@/lib/database/repositories";
import { formatCurrency } from "@/lib/dates";
import { summarizeOverview } from "@/lib/overview";
import { settingsHref, subscriptionDetailsHref, subscriptionsHref } from "@/lib/navigation";
import { useLifecycleDate } from "@/store/lifecycle";
import { useSyncStore } from "@/store/sync";
import type { SubscriptionPeriodDetails } from "@/types";

export default function OverviewScreen() {
  const router = useRouter();
  const asOfDate = useLifecycleDate();
  const dataVersion = useSyncStore((state) => state.dataVersion);
  const [periods, setPeriods] = useState<SubscriptionPeriodDetails[]>([]);
  const [isPeriodSheetVisible, setIsPeriodSheetVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const loadOverview = useCallback(async () => {
    if (dataVersion !== useSyncStore.getState().dataVersion) return;
    const currentRequest = ++requestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const results = await listSubscriptionPeriods({ asOfDate });
      if (currentRequest === requestId.current) setPeriods(results);
    } catch (cause) {
      if (currentRequest === requestId.current) {
        setError(cause instanceof Error ? cause.message : "Could not load the overview.");
      }
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false);
    }
  }, [asOfDate, dataVersion]);

  useFocusEffect(
    useCallback(() => {
      void loadOverview();
      return () => {
        requestId.current += 1;
      };
    }, [loadOverview]),
  );

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void loadOverview();
    });
    return () => appStateSubscription.remove();
  }, [loadOverview]);

  const summary = summarizeOverview(periods);

  return (
    <AppScreenFrame
      headerAction={
        <IconButton icon="settings" label="Open settings" onPress={() => router.push(settingsHref)} />
      }
      onRefresh={() => void loadOverview()}
      refreshing={isLoading}
      subtitle="See who owes money and which periods need attention."
      title="Overview"
    >
      <Button
        accessibilityHint="Create a subscription period for a subscriber and WiFi network"
        onPress={() => setIsPeriodSheetVisible(true)}
        title="Add subscription"
      />

      {isLoading ? (
        <View className="items-center gap-3 py-8">
          <ActivityIndicator accessibilityLabel="Loading overview" />
          <ThemedText accessibilityLiveRegion="polite">Loading overview…</ThemedText>
        </View>
      ) : error ? (
        <Card className="gap-4">
          <ThemedText accessibilityRole="alert">Overview could not be loaded.</ThemedText>
          <ThemedText>{error}</ThemedText>
          <Button onPress={() => void loadOverview()} title="Try again" variant="secondary" />
        </Card>
      ) : (
        <>
          <View className="gap-3">
            <ThemedText variant="heading">Period status</ThemedText>
            <View className="flex-row gap-3">
              <Card className="flex-1 items-center justify-center gap-1 px-2">
                <ThemedText variant="display">{summary.activeCount}</ThemedText>
                <ThemedText className="text-center" variant="caption">Active</ThemedText>
              </Card>
              <Card className="flex-1 items-center justify-center gap-1 px-2">
                <ThemedText variant="display">{summary.expiringSoonCount}</ThemedText>
                <ThemedText className="text-center" variant="caption">Expiring soon</ThemedText>
              </Card>
              <Card className="flex-1 items-center justify-center gap-1 px-2">
                <ThemedText variant="display">{summary.expiredCount}</ThemedText>
                <ThemedText className="text-center" variant="caption">Expired</ThemedText>
              </Card>
            </View>
          </View>

          <View className="gap-3">
            <ThemedText variant="heading">Outstanding balance</ThemedText>
            <Pressable
              accessibilityHint="View subscription periods and their payment balances"
              accessibilityRole="button"
              className="min-h-11"
              onPress={() => router.push(subscriptionsHref)}
            >
              <Card className="gap-2">
                <ThemedText variant="label">Total remaining across all periods</ThemedText>
                <ThemedText variant="display">{formatCurrency(summary.totalUnpaid)}</ThemedText>
                <ThemedText variant="caption">
                  {summary.unpaidPeriodCount} period{summary.unpaidPeriodCount === 1 ? "" : "s"} with a balance
                </ThemedText>
              </Card>
            </Pressable>
          </View>

          <View className="gap-3">
            <View className="flex-row items-center justify-between gap-3">
              <ThemedText variant="heading">Needs attention</ThemedText>
              <Button
                onPress={() => router.push(subscriptionsHref)}
                size="sm"
                title="All periods"
                variant="secondary"
              />
            </View>
            {summary.attentionPeriods.length === 0 ? (
              periods.length === 0 ? (
                <EmptyState
                  action={{
                    label: "Add a subscription",
                    onPress: () => setIsPeriodSheetVisible(true),
                    accessibilityHint: "Create a subscription period",
                  }}
                  description="Add a period to track subscriber payments and upcoming expirations."
                  icon="plans"
                  title="No periods yet"
                />
              ) : (
                <EmptyState
                  description="All periods are paid and none are expiring soon or expired."
                  icon="plans"
                  title="Nothing needs attention"
                />
              )
            ) : (
              <View className="gap-3">
                {summary.attentionPeriods.map((period) => (
                  <PeriodListItem
                    key={period.id}
                    onPress={() => router.push(subscriptionDetailsHref(period.id))}
                    period={period}
                  />
                ))}
              </View>
            )}
          </View>
        </>
      )}
      <SubscriptionPeriodSheet
        onClose={() => setIsPeriodSheetVisible(false)}
        onSaved={(periodId) => {
          setIsPeriodSheetVisible(false);
          router.push(subscriptionDetailsHref(periodId));
        }}
        visible={isPeriodSheetVisible}
      />
    </AppScreenFrame>
  );
}
