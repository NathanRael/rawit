import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { AppScreenFrame } from "@/components/AppScreenFrame";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DetailDivider, DetailRow } from "@/components/DetailRow";
import { OverflowMenu, type OverflowMenuItem } from "@/components/OverflowMenu";
import { PaymentSheet } from "@/components/PaymentSheet";
import { SubscriptionStatusBadges } from "@/components/SubscriptionStatusBadges";
import { ThemedText } from "@/components/ThemedText";
import {
  cancelSubscriptionPeriod,
  deletePayment,
  deleteSubscriptionPeriod,
  getSubscriptionPeriodById,
  listPaymentsForSubscription,
} from "@/lib/database/repositories";
import { formatCurrency, formatDateLocal, getRemainingPaymentAmount } from "@/lib/dates";
import {
  renewSubscriptionHref,
  subscriptionEditHref,
  subscriptionsHref,
} from "@/lib/navigation";
import { useLifecycleDate } from "@/store/lifecycle";
import type { Payment, SubscriptionPeriodDetails } from "@/types";

export default function SubscriptionPeriodDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const periodId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const asOfDate = useLifecycleDate();
  const [period, setPeriod] = useState<SubscriptionPeriodDetails | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [isPaymentSheetVisible, setIsPaymentSheetVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(subscriptionsHref);
  };

  const loadPeriod = useCallback(async () => {
    if (!periodId) {
      setError("A subscription period ID is required to view this period.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [record, history] = await Promise.all([
        getSubscriptionPeriodById(periodId, asOfDate),
        listPaymentsForSubscription(periodId),
      ]);
      setPeriod(record);
      setPayments(history);
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

  const confirmPaymentDelete = async (payment: Payment) => {
    setIsWorking(true);
    setError(null);
    try {
      const deleted = await deletePayment(payment.id);
      if (!deleted) {
        setError("This payment no longer exists.");
      } else {
        setIsPaymentSheetVisible(false);
        setEditingPayment(null);
      }
      await loadPeriod();
      if (!deleted) setError("This payment no longer exists.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove this payment.");
    } finally {
      setIsWorking(false);
    }
  };

  const requestPaymentDelete = (payment: Payment) => {
    Alert.alert(
      "Remove payment?",
      `Remove the ${formatCurrency(payment.amount)} payment dated ${formatDateLocal(payment.paidAt)}? This will update the period balance.`,
      [
        { text: "Keep payment", style: "cancel" },
        {
          text: "Remove payment",
          style: "destructive",
          onPress: () => void confirmPaymentDelete(payment),
        },
      ],
    );
  };

  const openNewPayment = () => {
    setEditingPayment(null);
    setIsPaymentSheetVisible(true);
  };

  const openEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setIsPaymentSheetVisible(true);
  };

  const closePaymentSheet = () => {
    setIsPaymentSheetVisible(false);
    setEditingPayment(null);
  };

  const menuItems: OverflowMenuItem[] = period
    ? [
        {
          key: "edit",
          label: "Edit period",
          onPress: () => router.push(subscriptionEditHref(period.id)),
          disabled: isWorking,
        },
        ...(period.lifecycleStatus !== "cancelled"
          ? [
              {
                key: "cancel",
                label: "Cancel period",
                onPress: requestCancel,
                destructive: true,
                disabled: isWorking,
              },
            ]
          : []),
        {
          key: "delete",
          label: "Delete period",
          onPress: requestDelete,
          destructive: true,
          disabled: isWorking || period.paymentCount > 0,
        },
      ]
    : [];

  return (
    <AppScreenFrame
      headerAction={
        period ? <OverflowMenu items={menuItems} label="More period actions" /> : null
      }
      onBack={goBack}
      subtitle="Review period dates, lifecycle, amount, and payment status."
      title="Period details"
    >
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
          <Card className="gap-3">
            <View className="gap-1">
              <ThemedText variant="heading">{period.subscriberName}</ThemedText>
              <ThemedText>{period.wifiNetworkName}</ThemedText>
            </View>
            <SubscriptionStatusBadges
              lifecycleStatus={period.lifecycleStatus}
              paymentStatus={period.paymentStatus}
            />
          </Card>

          <Card>
            <DetailRow label="Starts" value={formatDateLocal(period.startDate)} />
            <DetailDivider />
            <DetailRow label="Expires" value={formatDateLocal(period.expirationDate)} />
            <DetailDivider />
            <DetailRow
              label="Duration"
              value={`${period.durationValue} ${period.durationUnit}${period.durationValue === 1 ? "" : "s"}`}
            />
            {period.cancelledAt ? (
              <>
                <DetailDivider />
                <DetailRow
                  label="Cancelled"
                  value={new Date(period.cancelledAt).toLocaleDateString()}
                />
              </>
            ) : null}
          </Card>

          <Card>
            <DetailRow label="Amount due" value={formatCurrency(period.amount)} />
            <DetailDivider />
            <DetailRow label="Paid" value={formatCurrency(period.amountPaid)} />
            <DetailDivider />
            <DetailRow
              emphasized
              label="Remaining"
              value={formatCurrency(getRemainingPaymentAmount(period.amount, period.amountPaid))}
            />
          </Card>

          <Card className="gap-2">
            <ThemedText variant="label">Notes</ThemedText>
            <ThemedText>{period.notes ?? "No notes added."}</ThemedText>
          </Card>

          <View className="gap-3">
            <View className="flex-row items-center justify-between gap-3">
              <ThemedText variant="heading">Payment history</ThemedText>
              <Button
                disabled={isWorking}
                onPress={openNewPayment}
                size="sm"
                title="Record payment"
                variant="secondary"
              />
            </View>
            <Card>
              {payments.length === 0 ? (
                <ThemedText>No payments recorded for this period.</ThemedText>
              ) : (
                payments.map((payment, index) => (
                  <View className="gap-2" key={payment.id}>
                    {index > 0 ? <DetailDivider /> : null}
                    <View className="flex-row items-center justify-between gap-3 py-1">
                      <View className="flex-1 gap-1">
                        <ThemedText variant="heading">{formatCurrency(payment.amount)}</ThemedText>
                        <ThemedText variant="caption">{formatDateLocal(payment.paidAt)}</ThemedText>
                        {payment.notes ? <ThemedText>{payment.notes}</ThemedText> : null}
                      </View>
                      <OverflowMenu
                        items={[
                          {
                            key: "edit",
                            label: "Edit payment",
                            onPress: () => openEditPayment(payment),
                            disabled: isWorking,
                          },
                          {
                            key: "remove",
                            label: "Remove payment",
                            onPress: () => requestPaymentDelete(payment),
                            destructive: true,
                            disabled: isWorking,
                          },
                        ]}
                        label={`More actions for payment on ${formatDateLocal(payment.paidAt)}`}
                      />
                    </View>
                  </View>
                ))
              )}
            </Card>
          </View>

          {error ? <ThemedText accessibilityRole="alert">{error}</ThemedText> : null}
          {period.paymentCount > 0 ? (
            <ThemedText variant="caption">
              This period has {period.paymentCount} payment{period.paymentCount === 1 ? "" : "s"}. Its history must be kept, so deletion is unavailable.
            </ThemedText>
          ) : null}

          <Button
            disabled={isWorking}
            onPress={() => router.push(renewSubscriptionHref(period.id))}
            title="Renew period"
            accessibilityHint="Create a separate new period prefilled from this one"
          />

          <PaymentSheet
            onClose={closePaymentSheet}
            onSaved={async () => {
              closePaymentSheet();
              await loadPeriod();
            }}
            payment={editingPayment ?? undefined}
            subscriptionId={period.id}
            visible={isPaymentSheetVisible}
          />
        </View>
      ) : null}
    </AppScreenFrame>
  );
}
