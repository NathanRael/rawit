import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { AppScreenFrame } from "@/components/AppScreenFrame";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DetailDivider, DetailRow } from "@/components/DetailRow";
import { OverflowMenu, type OverflowMenuItem } from "@/components/OverflowMenu";
import { SubscriberSheet } from "@/components/SubscriberSheet";
import { SubscriptionStatusBadges } from "@/components/SubscriptionStatusBadges";
import { ThemedText } from "@/components/ThemedText";
import {
  deleteSubscriber,
  getSubscriberById,
  listSubscriberSubscriptionPeriods,
} from "@/lib/database/repositories";
import {
  formatCurrency,
  formatDateLocal,
  getLocalDate,
  getRemainingPaymentAmount,
} from "@/lib/dates";
import { subscribersHref } from "@/lib/navigation";
import type { Subscriber, SubscriberSubscriptionPeriod } from "@/types";

function SubscriptionRecord({ period }: { period: SubscriberSubscriptionPeriod }) {
  return (
    <Card className="gap-3">
      <View className="gap-2">
        <ThemedText variant="heading">{period.wifiNetworkName}</ThemedText>
        <SubscriptionStatusBadges
          lifecycleStatus={period.lifecycleStatus}
          paymentStatus={period.paymentStatus}
        />
      </View>
      <DetailRow label="Starts" value={formatDateLocal(period.startDate)} />
      <DetailDivider />
      <DetailRow label="Expires" value={formatDateLocal(period.expirationDate)} />
      <DetailDivider />
      <DetailRow label="Due" value={formatCurrency(period.amount)} />
      <DetailDivider />
      <DetailRow label="Paid" value={formatCurrency(period.amountPaid)} />
      <DetailDivider />
      <DetailRow
        emphasized
        label="Remaining"
        value={formatCurrency(getRemainingPaymentAmount(period.amount, period.amountPaid))}
      />
      {period.notes ? <ThemedText variant="caption">{period.notes}</ThemedText> : null}
    </Card>
  );
}

export default function SubscriberDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const subscriberId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [periods, setPeriods] = useState<SubscriberSubscriptionPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditSheetVisible, setIsEditSheetVisible] = useState(false);
  const [showAllPeriods, setShowAllPeriods] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(subscribersHref);
  };

  const loadSubscriber = useCallback(async () => {
    if (!subscriberId) {
      setError("A subscriber ID is required to view this subscriber.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [record, history] = await Promise.all([
        getSubscriberById(subscriberId),
        listSubscriberSubscriptionPeriods(subscriberId),
      ]);
      setSubscriber(record);
      setPeriods(history);
      if (!record) setError("This subscriber could not be found. It may have been removed.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load this subscriber.");
    } finally {
      setIsLoading(false);
    }
  }, [subscriberId]);

  useFocusEffect(
    useCallback(() => {
      void loadSubscriber();
    }, [loadSubscriber]),
  );

  const requestDelete = () => {
    if (!subscriber) return;
    Alert.alert(
      "Delete subscriber?",
      `Delete “${subscriber.name}”? This action cannot be undone.`,
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
    if (!subscriberId) return;
    setError(null);
    try {
      const result = await deleteSubscriber(subscriberId);
      if (result.deleted) {
        router.replace(subscribersHref);
      } else if (result.reason === "has_history") {
        await loadSubscriber();
        setError(
          `This subscriber has ${result.subscriptionCount} linked subscription${result.subscriptionCount === 1 ? "" : "s"} and cannot be deleted.`,
        );
      } else {
        setSubscriber(null);
        setError("This subscriber no longer exists.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this subscriber.");
    }
  };

  const today = getLocalDate();
  const currentNetworkNames = [
    ...new Set(
      periods
        .filter(
          (period) =>
            period.startDate <= today &&
            (period.lifecycleStatus === "active" || period.lifecycleStatus === "expiring_soon"),
        )
        .map((period) => period.wifiNetworkName),
    ),
  ];
  const displayedPeriods = showAllPeriods ? periods : periods.slice(0, 3);

  const menuItems: OverflowMenuItem[] = subscriber
    ? [
        {
          key: "edit",
          label: "Edit subscriber",
          onPress: () => setIsEditSheetVisible(true),
        },
        {
          key: "delete",
          label: "Delete subscriber",
          onPress: requestDelete,
          destructive: true,
          disabled: periods.length > 0,
        },
      ]
    : [];

  return (
    <AppScreenFrame
      headerAction={
        subscriber ? <OverflowMenu items={menuItems} label="More subscriber actions" /> : null
      }
      onBack={goBack}
      subtitle="View subscriber details and linked history."
      title="Subscriber details"
    >
      {isLoading ? (
        <View className="items-center gap-3 py-8">
          <ActivityIndicator accessibilityLabel="Loading subscriber details" />
          <ThemedText accessibilityLiveRegion="polite">Loading subscriber…</ThemedText>
        </View>
      ) : error && !subscriber ? (
        <Card className="gap-4">
          <ThemedText accessibilityRole="alert">Subscriber unavailable</ThemedText>
          <ThemedText>{error}</ThemedText>
          <Button onPress={() => void loadSubscriber()} title="Try again" variant="secondary" />
        </Card>
      ) : subscriber ? (
        <View className="gap-5">
          <Card>
            <ThemedText variant="heading">{subscriber.name}</ThemedText>
            <DetailRow label="Phone" value={subscriber.phone ?? "Not provided"} />
            <DetailDivider />
            <DetailRow label="Email" value={subscriber.email ?? "Not provided"} />
          </Card>

          <Card className="gap-2">
            <ThemedText variant="label">Notes</ThemedText>
            <ThemedText>{subscriber.notes ?? "No notes added."}</ThemedText>
          </Card>

          <View className="gap-2">
            <ThemedText variant="heading">Current subscriptions</ThemedText>
            <ThemedText>
              {currentNetworkNames.length === 0
                ? "No current network subscriptions."
                : currentNetworkNames.join(", ")}
            </ThemedText>
          </View>

          <View className="gap-3">
            <ThemedText variant="heading">Subscription history</ThemedText>
            {periods.length === 0 ? (
              <ThemedText>No linked subscription history.</ThemedText>
            ) : (
              <>
                {displayedPeriods.map((period) => (
                  <SubscriptionRecord key={period.id} period={period} />
                ))}
                {periods.length > 3 ? (
                  <Button
                    onPress={() => setShowAllPeriods((showingAll) => !showingAll)}
                    title={showAllPeriods ? "Show less" : "Show all"}
                    variant="secondary"
                  />
                ) : null}
              </>
            )}
          </View>

          {error ? <ThemedText accessibilityRole="alert">{error}</ThemedText> : null}
          {periods.length > 0 ? (
            <ThemedText variant="caption">
              A subscriber with linked subscription or payment history cannot be deleted. The history
              remains linked to this subscriber.
            </ThemedText>
          ) : null}
        </View>
      ) : null}
      <SubscriberSheet
        onClose={() => setIsEditSheetVisible(false)}
        onSaved={() => {
          setIsEditSheetVisible(false);
          void loadSubscriber();
        }}
        subscriberId={subscriber?.id}
        visible={isEditSheetVisible}
      />
    </AppScreenFrame>
  );
}
