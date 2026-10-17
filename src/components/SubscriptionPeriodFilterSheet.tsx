import { useState } from "react";
import { Pressable, View } from "react-native";

import { Button } from "@/components/Button";
import { DateField } from "@/components/DateField";
import { FormSheet } from "@/components/FormSheet";
import { ThemedText } from "@/components/ThemedText";
import { getLocalDate, parseLocalDate } from "@/lib/dates";
import type { LocalDate } from "@/types";

export type AdvancedPeriodFilters = {
  subscriberId: string | null;
  expirationFrom: LocalDate | null;
  expirationTo: LocalDate | null;
};

export type PeriodSubscriberOption = {
  id: string;
  name: string;
};

type SubscriptionPeriodFilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: AdvancedPeriodFilters) => void;
  filters: AdvancedPeriodFilters;
  subscribers: PeriodSubscriberOption[];
};

export function SubscriptionPeriodFilterSheet({
  visible,
  onClose,
  onApply,
  filters,
  subscribers,
}: SubscriptionPeriodFilterSheetProps) {
  const [subscriberId, setSubscriberId] = useState<string | null>(filters.subscriberId);
  const [isSubscriberSelectOpen, setIsSubscriberSelectOpen] = useState(false);
  const [isDateRangeEnabled, setIsDateRangeEnabled] = useState(filters.expirationFrom !== null);
  const [expirationFrom, setExpirationFrom] = useState<LocalDate>(
    filters.expirationFrom ?? getLocalDate(),
  );
  const [expirationTo, setExpirationTo] = useState<LocalDate | null>(filters.expirationTo);
  const [dateError, setDateError] = useState<string | null>(null);

  const selectedSubscriber = subscribers.find((subscriber) => subscriber.id === subscriberId);

  const applyFilters = () => {
    if (!isDateRangeEnabled) {
      onApply({ subscriberId, expirationFrom: null, expirationTo: null });
      return;
    }

    try {
      parseLocalDate(expirationFrom);
      if (expirationTo) {
        parseLocalDate(expirationTo);
        if (expirationTo < expirationFrom) {
          setDateError("The end date must be on or after the start date.");
          return;
        }
      }
    } catch {
      setDateError("Enter a valid date to apply this range.");
      return;
    }

    onApply({ subscriberId, expirationFrom, expirationTo });
  };

  return (
    <FormSheet
      description="Narrow periods by subscriber or expiration date."
      maxHeightRatio={0.9}
      onClose={onClose}
      title="Advanced filters"
      visible={visible}
    >
      <View className="gap-2">
        <ThemedText variant="label">Subscriber</ThemedText>
        <Pressable
          accessibilityLabel={`Subscriber, ${selectedSubscriber?.name ?? "All subscribers"}`}
          accessibilityRole="button"
          accessibilityState={{ expanded: isSubscriberSelectOpen }}
          className="min-h-12 flex-row items-center justify-between rounded-control border-2 border-ink bg-white px-3 py-3"
          onPress={() => setIsSubscriberSelectOpen((open) => !open)}
        >
          <ThemedText>{selectedSubscriber?.name ?? "All subscribers"}</ThemedText>
          <ThemedText variant="label">{isSubscriberSelectOpen ? "−" : "+"}</ThemedText>
        </Pressable>
        {isSubscriberSelectOpen ? (
          <View className="gap-1 rounded-control border-2 border-ink bg-white p-2">
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: subscriberId === null }}
              className={`min-h-11 justify-center rounded-control px-3 ${subscriberId === null ? "bg-brand" : "bg-white"}`}
              onPress={() => {
                setSubscriberId(null);
                setIsSubscriberSelectOpen(false);
              }}
            >
              <ThemedText variant="label">All subscribers</ThemedText>
            </Pressable>
            {subscribers.map((subscriber) => (
              <Pressable
                key={subscriber.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: subscriber.id === subscriberId }}
                className={`min-h-11 justify-center rounded-control px-3 ${subscriber.id === subscriberId ? "bg-brand" : "bg-white"}`}
                onPress={() => {
                  setSubscriberId(subscriber.id);
                  setIsSubscriberSelectOpen(false);
                }}
              >
                <ThemedText variant="label">{subscriber.name}</ThemedText>
              </Pressable>
            ))}
            {subscribers.length === 0 ? (
              <ThemedText className="px-3 py-2">No subscribers with periods yet.</ThemedText>
            ) : null}
          </View>
        ) : null}
      </View>

      <View className="gap-3">
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isDateRangeEnabled }}
          className="min-h-11 flex-row items-center gap-3"
          onPress={() => {
            setIsDateRangeEnabled((enabled) => !enabled);
            setDateError(null);
          }}
        >
          <View
            className={`h-6 w-6 items-center justify-center rounded-control border-2 border-ink ${isDateRangeEnabled ? "bg-brand" : "bg-white"}`}
          >
            {isDateRangeEnabled ? <ThemedText variant="label">✓</ThemedText> : null}
          </View>
          <ThemedText variant="label">Expiration date range</ThemedText>
        </Pressable>
        {isDateRangeEnabled ? (
          <View className="gap-3">
            <DateField
              label="From date"
              onChange={(value) => {
                setExpirationFrom(value);
                setDateError(null);
              }}
              value={expirationFrom}
            />
            {expirationTo ? (
              <View className="gap-2">
                <DateField
                  label="To date (optional)"
                  onChange={(value) => {
                    setExpirationTo(value);
                    setDateError(null);
                  }}
                  value={expirationTo}
                />
                <Button
                  onPress={() => {
                    setExpirationTo(null);
                    setDateError(null);
                  }}
                  size="sm"
                  title="Remove end date"
                  variant="secondary"
                />
              </View>
            ) : (
              <Button
                onPress={() => {
                  setExpirationTo(expirationFrom);
                  setDateError(null);
                }}
                title="Add end date"
                variant="secondary"
              />
            )}
            {dateError ? (
              <ThemedText accessibilityRole="alert" variant="caption">
                {dateError}
              </ThemedText>
            ) : null}
          </View>
        ) : null}
      </View>

      <View className="gap-3">
        <Button onPress={applyFilters} title="Apply filters" />
        <Button
          onPress={() => {
            setSubscriberId(null);
            setIsSubscriberSelectOpen(false);
            setIsDateRangeEnabled(false);
            setExpirationFrom(getLocalDate());
            setExpirationTo(null);
            setDateError(null);
            onApply({ subscriberId: null, expirationFrom: null, expirationTo: null });
          }}
          title="Clear advanced filters"
          variant="secondary"
        />
      </View>
    </FormSheet>
  );
}
