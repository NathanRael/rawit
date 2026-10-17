import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { AppScreenFrame } from "@/components/AppScreenFrame";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { SubscriberSheet } from "@/components/SubscriberSheet";
import { TextField } from "@/components/TextField";
import { ThemedText } from "@/components/ThemedText";
import { listSubscribers } from "@/lib/database/repositories";
import { subscriberDetailsHref } from "@/lib/navigation";
import type { Subscriber } from "@/types";

export default function SubscribersScreen() {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddSheetVisible, setIsAddSheetVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const loadSubscribers = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const results = await listSubscribers(search);
      if (currentRequest === requestId.current) setSubscribers(results);
    } catch (cause) {
      if (currentRequest === requestId.current) {
        setError(cause instanceof Error ? cause.message : "Could not load subscribers.");
      }
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false);
    }
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      void loadSubscribers();
      return () => {
        requestId.current += 1;
      };
    }, [loadSubscribers]),
  );

  return (
    <AppScreenFrame
      onRefresh={() => void loadSubscribers()}
      refreshing={isLoading}
      subtitle="Keep subscriber details and network history together."
      title="Subscribers"
    >
      <Button
        onPress={() => setIsAddSheetVisible(true)}
        title="Add a subscriber"
        accessibilityHint="Create a subscriber record"
      />
      <TextField
        accessibilityHint="Search subscriber names, phone numbers, or email addresses"
        autoCapitalize="none"
        autoCorrect={false}
        label="Search subscribers"
        onChangeText={setSearch}
        placeholder="Name, phone, or email"
        returnKeyType="search"
        value={search}
      />
      {isLoading ? (
        <View className="items-center gap-3 py-8">
          <ActivityIndicator accessibilityLabel="Loading subscribers" />
          <ThemedText accessibilityLiveRegion="polite">Loading subscribers…</ThemedText>
        </View>
      ) : error ? (
        <Card className="gap-4">
          <ThemedText accessibilityRole="alert">Subscribers could not be loaded.</ThemedText>
          <ThemedText>{error}</ThemedText>
          <Button onPress={() => void loadSubscribers()} title="Try again" variant="secondary" />
        </Card>
      ) : subscribers.length === 0 ? (
        <EmptyState
          action={
            search.trim()
              ? { label: "Clear search", onPress: () => setSearch("") }
              : {
                  label: "Add a subscriber",
                  onPress: () => setIsAddSheetVisible(true),
                }
          }
          description={
            search.trim()
              ? "No subscribers match this search. Try another name or contact detail."
              : "Add a subscriber to keep contact details and future subscription history in one place."
          }
          icon="people"
          title={search.trim() ? "No matching subscribers" : "No subscribers yet"}
        />
      ) : (
        <View className="gap-4">
          {subscribers.map((subscriber) => (
            <Pressable
              accessibilityHint="Open subscriber details and subscription history"
              accessibilityLabel={`${subscriber.name}${subscriber.phone ? `, ${subscriber.phone}` : ""}${subscriber.email ? `, ${subscriber.email}` : ""}`}
              accessibilityRole="button"
              className="min-h-11"
              key={subscriber.id}
              onPress={() => router.push(subscriberDetailsHref(subscriber.id))}
            >
              <Card className="gap-2">
                <ThemedText variant="label">{subscriber.name}</ThemedText>
                <ThemedText variant="caption">
                  {subscriber.phone ?? subscriber.email ?? "No contact details"}
                </ThemedText>
                {subscriber.phone && subscriber.email ? (
                  <ThemedText variant="caption">{subscriber.email}</ThemedText>
                ) : null}
                {subscriber.notes ? <ThemedText numberOfLines={2}>{subscriber.notes}</ThemedText> : null}
              </Card>
            </Pressable>
          ))}
        </View>
      )}
      <SubscriberSheet
        onClose={() => setIsAddSheetVisible(false)}
        onCreated={() => {
          setIsAddSheetVisible(false);
          void loadSubscribers();
        }}
        visible={isAddSheetVisible}
      />
    </AppScreenFrame>
  );
}
