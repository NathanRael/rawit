import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { AppScreenFrame } from "@/components/AppScreenFrame";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import {
  deleteSubscriber,
  getSubscriberById,
  listSubscriberSubscriptionPeriods,
} from "@/lib/database/repositories";
import { formatDateLocal, getLocalDate } from "@/lib/dates";
import { subscriberEditHref, subscribersHref } from "@/lib/navigation";
import type { Subscriber, SubscriberSubscriptionPeriod } from "@/types";

function lifecycleLabel(period: SubscriberSubscriptionPeriod): string {
  if (period.lifecycleStatus === "expiring_soon") return "Expiring soon";
  return period.lifecycleStatus.charAt(0).toUpperCase() + period.lifecycleStatus.slice(1);
}

function paymentLabel(period: SubscriberSubscriptionPeriod): string {
  if (period.paymentStatus === "partially_paid") return "Partially paid";
  return period.paymentStatus.charAt(0).toUpperCase() + period.paymentStatus.slice(1);
}

function SubscriptionRecord({ period }: { period: SubscriberSubscriptionPeriod }) {
  return (
    <Card className="gap-2">
      <ThemedText variant="label">{period.wifiNetworkName}</ThemedText>
      <ThemedText>Lifecycle · {lifecycleLabel(period)}</ThemedText>
      <ThemedText>Payment · {paymentLabel(period)}</ThemedText>
      <ThemedText>Started · {formatDateLocal(period.startDate)}</ThemedText>
      <ThemedText>Expires · {formatDateLocal(period.expirationDate)}</ThemedText>
      <ThemedText>
        Paid · {period.amountPaid.toFixed(2)} of {period.amount.toFixed(2)}
      </ThemedText>
      {period.notes ? <ThemedText>{period.notes}</ThemedText> : null}
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
  const [error, setError] = useState<string | null>(null);

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
  const currentPeriods = periods.filter(
    (period) =>
      period.startDate <= today &&
      (period.lifecycleStatus === "active" || period.lifecycleStatus === "expiring_soon"),
  );

  return (
    <AppScreenFrame subtitle="View subscriber details and linked history." title="Subscriber details">
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
          <Card className="gap-4">
            <ThemedText variant="heading">{subscriber.name}</ThemedText>
            <View className="gap-1">
              <ThemedText variant="label">Phone</ThemedText>
              <ThemedText>{subscriber.phone ?? "Not provided"}</ThemedText>
            </View>
            <View className="gap-1">
              <ThemedText variant="label">Email</ThemedText>
              <ThemedText>{subscriber.email ?? "Not provided"}</ThemedText>
            </View>
            <View className="gap-1">
              <ThemedText variant="label">Notes</ThemedText>
              <ThemedText>{subscriber.notes ?? "No notes added."}</ThemedText>
            </View>
          </Card>

          <View className="gap-3">
            <ThemedText variant="heading">Current subscriptions</ThemedText>
            {currentPeriods.length === 0 ? (
              <ThemedText>No current network subscriptions.</ThemedText>
            ) : (
              currentPeriods.map((period) => <SubscriptionRecord key={period.id} period={period} />)
            )}
          </View>

          <View className="gap-3">
            <ThemedText variant="heading">Subscription history</ThemedText>
            {periods.length === 0 ? (
              <ThemedText>No linked subscription history.</ThemedText>
            ) : (
              periods.map((period) => <SubscriptionRecord key={period.id} period={period} />)
            )}
          </View>

          {error ? <ThemedText accessibilityRole="alert">{error}</ThemedText> : null}
          <Button
            onPress={() => router.push(subscriberEditHref(subscriber.id))}
            title="Edit subscriber"
            accessibilityHint="Change this subscriber's name, contact details, or notes"
          />
          {periods.length > 0 ? (
            <View className="gap-2">
              <Button disabled onPress={requestDelete} title="Delete subscriber" variant="danger" />
              <ThemedText>
                A subscriber with linked subscription or payment history cannot be deleted. The history
                remains linked to this subscriber.
              </ThemedText>
            </View>
          ) : (
            <Button onPress={requestDelete} title="Delete subscriber" variant="danger" />
          )}
        </View>
      ) : null}
    </AppScreenFrame>
  );
}
