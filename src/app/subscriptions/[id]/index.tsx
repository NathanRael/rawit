import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { AppScreenFrame } from "@/components/AppScreenFrame";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import {
  cancelSubscriptionPeriod,
  deleteSubscriptionPeriod,
  getSubscriptionPeriodById,
} from "@/lib/database/repositories";
import { formatCurrency, formatDateLocal } from "@/lib/dates";
import { subscriptionEditHref, subscriptionsHref } from "@/lib/navigation";
import { useLifecycleDate } from "@/store/lifecycle";
import type { SubscriptionLifecycleStatus, SubscriptionPeriodDetails } from "@/types";

function lifecycleLabel(status: SubscriptionLifecycleStatus): string {
  if (status === "expiring_soon") return "Expiring soon";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function lifecycleTone(status: SubscriptionLifecycleStatus): "success" | "warning" | "danger" | "neutral" {
  if (status === "active") return "success";
  if (status === "expiring_soon") return "warning";
  if (status === "expired") return "danger";
  return "neutral";
}

function paymentLabel(status: SubscriptionPeriodDetails["paymentStatus"]): string {
  if (status === "partially_paid") return "Partially paid";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function paymentTone(status: SubscriptionPeriodDetails["paymentStatus"]): "success" | "warning" | "danger" {
  if (status === "paid") return "success";
  if (status === "partially_paid") return "warning";
  return "danger";
}

export default function SubscriptionPeriodDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const periodId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const asOfDate = useLifecycleDate();
  const [period, setPeriod] = useState<SubscriptionPeriodDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPeriod = useCallback(async () => {
    if (!periodId) {
      setError("A subscription period ID is required to view this period.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const record = await getSubscriptionPeriodById(periodId, asOfDate);
      setPeriod(record);
      if (!record) setError("This subscription period could not be found. It may have been removed.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load this subscription period.");
    } finally {
      setIsLoading(false);
    }
  }, [asOfDate, periodId]);

  useFocusEffect(
    useCallback(() => {
      void loadPeriod();
    }, [loadPeriod]),
  );

  const confirmCancel = async () => {
    if (!periodId) return;
    setIsWorking(true);
    setError(null);
    try {
      const cancelled = await cancelSubscriptionPeriod(periodId);
      if (!cancelled) setError("This period was already cancelled or no longer exists.");
      await loadPeriod();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not cancel this period.");
    } finally {
      setIsWorking(false);
    }
  };

  const requestCancel = () => {
    if (!period) return;
    Alert.alert(
      "Cancel subscription period?",
      `Cancel ${period.subscriberName}’s period on ${period.wifiNetworkName}? The history and payments will be kept.`,
      [
        { text: "Keep period", style: "cancel" },
        { text: "Cancel period", style: "destructive", onPress: () => void confirmCancel() },
      ],
    );
  };

  const confirmDelete = async () => {
    if (!periodId) return;
    setIsWorking(true);
    setError(null);
    try {
      const result = await deleteSubscriptionPeriod(periodId);
      if (result.deleted) {
        router.replace(subscriptionsHref);
      } else if (result.reason === "has_payments") {
        await loadPeriod();
        setError(
          `This period has ${result.paymentCount} payment${result.paymentCount === 1 ? "" : "s"} and cannot be deleted.`,
        );
      } else {
        setPeriod(null);
        setError("This subscription period no longer exists.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this period.");
    } finally {
      setIsWorking(false);
    }
  };

  const requestDelete = () => {
    if (!period) return;
    Alert.alert(
      "Delete subscription period?",
      `Delete ${period.subscriberName}’s period on ${period.wifiNetworkName}? This action cannot be undone.`,
      [
        { text: "Keep period", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => void confirmDelete() },
      ],
    );
  };

  return (
    <AppScreenFrame subtitle="Review period dates, lifecycle, amount, and payment status." title="Period details">
      {isLoading ? (
        <View className="items-center gap-3 py-8">
          <ActivityIndicator accessibilityLabel="Loading subscription period details" />
          <ThemedText accessibilityLiveRegion="polite">Loading period…</ThemedText>
        </View>
      ) : error && !period ? (
        <Card className="gap-4">
          <ThemedText accessibilityRole="alert">Period unavailable</ThemedText>
          <ThemedText>{error}</ThemedText>
          <Button onPress={() => void loadPeriod()} title="Try again" variant="secondary" />
        </Card>
      ) : period ? (
        <View className="gap-5">
          <Card className="gap-4">
            <View className="gap-1">
              <ThemedText variant="heading">{period.subscriberName}</ThemedText>
              <ThemedText>{period.wifiNetworkName}</ThemedText>
            </View>
            <View className="flex-row flex-wrap gap-2">
              <Badge label={`Lifecycle · ${lifecycleLabel(period.lifecycleStatus)}`} tone={lifecycleTone(period.lifecycleStatus)} />
              <Badge label={`Payment · ${paymentLabel(period.paymentStatus)}`} tone={paymentTone(period.paymentStatus)} />
            </View>
            <View className="gap-1">
              <ThemedText variant="label">Period</ThemedText>
              <ThemedText>Starts · {formatDateLocal(period.startDate)}</ThemedText>
              <ThemedText>Expires · {formatDateLocal(period.expirationDate)}</ThemedText>
              <ThemedText>
                Duration · {period.durationValue} {period.durationUnit}{period.durationValue === 1 ? "" : "s"}
              </ThemedText>
            </View>
            <View className="gap-1">
              <ThemedText variant="label">Amount</ThemedText>
              <ThemedText>Due · {formatCurrency(period.amount)}</ThemedText>
              <ThemedText>Paid · {formatCurrency(period.amountPaid)}</ThemedText>
            </View>
            <View className="gap-1">
              <ThemedText variant="label">Notes</ThemedText>
              <ThemedText>{period.notes ?? "No notes added."}</ThemedText>
            </View>
            {period.cancelledAt ? (
              <ThemedText>Cancelled · {new Date(period.cancelledAt).toLocaleDateString()}</ThemedText>
            ) : null}
          </Card>

          {error ? <ThemedText accessibilityRole="alert">{error}</ThemedText> : null}
          <Button
            disabled={isWorking}
            onPress={() => router.push(subscriptionEditHref(period.id))}
            title="Edit period"
            accessibilityHint="Change this subscription period’s subscriber, network, dates, amount, or notes"
          />
          {period.lifecycleStatus !== "cancelled" ? (
            <Button
              disabled={isWorking}
              onPress={requestCancel}
              title="Cancel period"
              variant="secondary"
            />
          ) : null}
          <Button
            accessibilityHint={
              period.paymentCount > 0
                ? "A period with payment history cannot be deleted"
                : "Permanently delete this period"
            }
            disabled={isWorking || period.paymentCount > 0}
            onPress={requestDelete}
            title="Delete period"
            variant="danger"
          />
          {period.paymentCount > 0 ? (
            <ThemedText>
              This period has {period.paymentCount} payment{period.paymentCount === 1 ? "" : "s"}. Its history must be kept, so deletion is unavailable.
            </ThemedText>
          ) : null}
        </View>
      ) : null}
    </AppScreenFrame>
  );
}
