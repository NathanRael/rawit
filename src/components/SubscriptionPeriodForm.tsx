import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DateField } from "@/components/DateField";
import { FilterChip } from "@/components/FilterChip";
import { FormActions } from "@/components/FormActions";
import { TextField } from "@/components/TextField";
import { ThemedText } from "@/components/ThemedText";
import {
  createSubscriptionPeriod,
  getSubscriptionPeriodById,
  listSubscribers,
  listWifiNetworks,
  updateSubscriptionPeriod,
} from "@/lib/database/repositories";
import { addDuration, getLocalDate } from "@/lib/dates";
import {
  subscribersHref,
  subscriptionDetailsHref,
  subscriptionsHref,
  wifiNetworksHref,
} from "@/lib/navigation";
import {
  subscriptionPeriodSchema,
  type SubscriptionPeriodFormValues,
} from "@/lib/validation/subscriptionPeriod";
import type { DurationUnit, NewSubscriptionPeriod, Subscriber, WifiNetwork } from "@/types";

type SubscriptionPeriodFormProps = {
  periodId?: string;
  renewFromId?: string;
};

const durationOptions: { label: string; value: DurationUnit }[] = [
  { label: "Days", value: "day" },
  { label: "Weeks", value: "week" },
  { label: "Months", value: "month" },
];

export function SubscriptionPeriodForm({ periodId, renewFromId }: SubscriptionPeriodFormProps) {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [networks, setNetworks] = useState<WifiNetwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionPeriodFormValues>({
    resolver: zodResolver(subscriptionPeriodSchema),
    defaultValues: {
      subscriberId: "",
      wifiNetworkId: "",
      startDate: getLocalDate(),
      durationValue: "1",
      durationUnit: "month",
      amount: "0",
      notes: "",
    },
  });

  const loadFormData = useCallback(
    async (isCurrent: () => boolean) => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [subscriberRecords, networkRecords, period, renewalSource] = await Promise.all([
          listSubscribers(),
          listWifiNetworks(),
          periodId ? getSubscriptionPeriodById(periodId) : Promise.resolve(null),
          renewFromId ? getSubscriptionPeriodById(renewFromId) : Promise.resolve(null),
        ]);
        if (!isCurrent()) return;
        setSubscribers(subscriberRecords);
        setNetworks(networkRecords);
        if (periodId && !period) {
          setLoadError("This subscription period could not be found. It may have been removed.");
          return;
        }
        if (renewFromId && !renewalSource) {
          setLoadError("The period to renew could not be found. It may have been removed.");
          return;
        }
        if (period) {
          reset({
            subscriberId: period.subscriberId,
            wifiNetworkId: period.wifiNetworkId,
            startDate: period.startDate,
            durationValue: String(period.durationValue),
            durationUnit: period.durationUnit,
            amount: String(period.amount),
            notes: period.notes ?? "",
          });
        } else if (renewalSource) {
          const earliestNextDate = addDuration(renewalSource.expirationDate, 1, "day");
          const today = getLocalDate();
          reset({
            subscriberId: renewalSource.subscriberId,
            wifiNetworkId: renewalSource.wifiNetworkId,
            startDate: earliestNextDate < today ? today : earliestNextDate,
            durationValue: String(renewalSource.durationValue),
            durationUnit: renewalSource.durationUnit,
            amount: String(renewalSource.amount),
            notes: renewalSource.notes ?? "",
          });
        } else {
          reset({
            subscriberId: subscriberRecords[0]?.id ?? "",
            wifiNetworkId: networkRecords[0]?.id ?? "",
            startDate: getLocalDate(),
            durationValue: "1",
            durationUnit: "month",
            amount: "0",
            notes: "",
          });
        }
      } catch (cause) {
        if (isCurrent()) {
          setLoadError(
            cause instanceof Error ? cause.message : "Could not load subscription form data.",
          );
        }
      } finally {
        if (isCurrent()) setIsLoading(false);
      }
    },
    [periodId, renewFromId, reset],
  );

  useFocusEffect(
    useCallback(() => {
      let isCurrent = true;
      void loadFormData(() => isCurrent);
      return () => {
        isCurrent = false;
      };
    }, [loadFormData]),
  );

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const input: NewSubscriptionPeriod = {
      subscriberId: values.subscriberId,
      wifiNetworkId: values.wifiNetworkId,
      startDate: values.startDate,
      durationValue: Number(values.durationValue),
      durationUnit: values.durationUnit,
      amount: Number(values.amount),
      notes: values.notes,
    };
    try {
      if (periodId) {
        const updated = await updateSubscriptionPeriod(periodId, input);
        if (!updated) {
          setSubmitError("This subscription period no longer exists.");
          return;
        }
        router.replace(subscriptionDetailsHref(updated.id));
        return;
      }

      const created = await createSubscriptionPeriod(input);
      router.replace(subscriptionDetailsHref(created.id));
    } catch (cause) {
      setSubmitError(cause instanceof Error ? cause.message : "Could not save this subscription period.");
    }
  });

  if (isLoading) {
    return (
      <View className="items-center gap-3 py-8">
        <ActivityIndicator accessibilityLabel="Loading subscription form" />
        <ThemedText accessibilityLiveRegion="polite">Loading subscription details…</ThemedText>
      </View>
    );
  }

  if (loadError) {
    return (
      <Card className="gap-4">
        <ThemedText accessibilityRole="alert">Subscription form unavailable.</ThemedText>
        <ThemedText>{loadError}</ThemedText>
        <Button
          onPress={() => {
            void loadFormData(() => true);
          }}
          title="Try again"
          variant="secondary"
        />
      </Card>
    );
  }

  if (subscribers.length === 0 || networks.length === 0) {
    return (
      <Card className="gap-4">
        <ThemedText variant="label">Prepare your records first</ThemedText>
        <ThemedText>
          A subscription period needs at least one subscriber and one WiFi network.
          {subscribers.length === 0 ? " Add a subscriber." : ""}
          {networks.length === 0 ? " Add a WiFi network." : ""}
        </ThemedText>
        {subscribers.length === 0 ? (
          <Button onPress={() => router.push(subscribersHref)} title="Go to subscribers" variant="secondary" />
        ) : null}
        {networks.length === 0 ? (
          <Button onPress={() => router.push(wifiNetworksHref)} title="Go to WiFi networks" variant="secondary" />
        ) : null}
        <Button
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace(subscriptionsHref);
          }}
          title="Cancel"
          variant="secondary"
        />
      </Card>
    );
  }

  return (
    <Card className="gap-5">
      <Controller
        control={control}
        name="subscriberId"
        render={({ field }) => (
          <View className="gap-2">
            <ThemedText variant="label">Subscriber *</ThemedText>
            <View className="flex-row flex-wrap gap-2">
              {subscribers.map((subscriber) => (
                <FilterChip
                  key={subscriber.id}
                  label={subscriber.name}
                  onPress={() => field.onChange(subscriber.id)}
                  selected={field.value === subscriber.id}
                />
              ))}
            </View>
            {errors.subscriberId ? (
              <ThemedText accessibilityRole="alert" variant="caption">
                {errors.subscriberId.message}
              </ThemedText>
            ) : null}
          </View>
        )}
      />

      <Controller
        control={control}
        name="wifiNetworkId"
        render={({ field }) => (
          <View className="gap-2">
            <ThemedText variant="label">WiFi network *</ThemedText>
            <View className="flex-row flex-wrap gap-2">
              {networks.map((network) => (
                <FilterChip
                  key={network.id}
                  label={network.name}
                  onPress={() => field.onChange(network.id)}
                  selected={field.value === network.id}
                />
              ))}
            </View>
            {errors.wifiNetworkId ? (
              <ThemedText accessibilityRole="alert" variant="caption">
                {errors.wifiNetworkId.message}
              </ThemedText>
            ) : null}
          </View>
        )}
      />

      <Controller
        control={control}
        name="startDate"
        render={({ field }) => (
          <DateField
            error={errors.startDate?.message}
            label="Start date *"
            onBlur={field.onBlur}
            onChange={field.onChange}
            value={field.value}
          />
        )}
      />

      <Controller
        control={control}
        name="durationValue"
        render={({ field }) => (
          <TextField
            error={errors.durationValue?.message}
            keyboardType="number-pad"
            label="Duration *"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="1"
            value={field.value}
          />
        )}
      />

      <Controller
        control={control}
        name="durationUnit"
        render={({ field }) => (
          <View className="gap-2">
            <ThemedText variant="label">Duration unit *</ThemedText>
            <View className="flex-row flex-wrap gap-2">
              {durationOptions.map((option) => (
                <FilterChip
                  key={option.value}
                  label={option.label}
                  onPress={() => field.onChange(option.value)}
                  selected={field.value === option.value}
                />
              ))}
            </View>
          </View>
        )}
      />

      <Controller
        control={control}
        name="amount"
        render={({ field }) => (
          <TextField
            error={errors.amount?.message}
            keyboardType="decimal-pad"
            label="Amount due *"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="0.00"
            value={field.value}
          />
        )}
      />

      <Controller
        control={control}
        name="notes"
        render={({ field }) => (
          <TextField
            error={errors.notes?.message}
            label="Notes (optional)"
            multiline
            numberOfLines={4}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="Add a note about this period"
            textAlignVertical="top"
            value={field.value}
          />
        )}
      />

      {submitError ? <ThemedText accessibilityRole="alert">{submitError}</ThemedText> : null}
      <FormActions
        isSubmitting={isSubmitting}
        onCancel={() => {
          if (router.canGoBack()) router.back();
          else router.replace(subscriptionsHref);
        }}
        onSave={() => void onSubmit()}
        saveTitle={periodId ? "Save changes" : "Create period"}
      />
    </Card>
  );
}
