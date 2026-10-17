import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { AppScreenFrame } from "@/components/AppScreenFrame";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { RecordDetail, RecordLeadingTile, RecordRow, RecordTitle } from "@/components/RecordRow";
import { SubscriberSheet } from "@/components/SubscriberSheet";
import { TextField } from "@/components/TextField";
import { ThemedText } from "@/components/ThemedText";
import { listSubscribers } from "@/lib/database/repositories";
import { subscriberDetailsHref } from "@/lib/navigation";
import type { Subscriber } from "@/types";

/** Up to two initials from the name, used in the leading tile. */
function initialsOf(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase());
  return letters.join("") || "?";
}

export default function SubscribersScreen() {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [hasSubscribers, setHasSubscribers] = useState(false);
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
      if (currentRequest === requestId.current) {
        setSubscribers(results);
        if (!search.trim()) setHasSubscribers(results.length > 0);
      }
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
      {isLoading || error || hasSubscribers ? (
        <Button
          onPress={() => setIsAddSheetVisible(true)}
          title="Add a subscriber"
          accessibilityHint="Create a subscriber record"
        />
      ) : null}
      {hasSubscribers ? (
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
      ) : null}
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
        <View className="gap-3">
          {subscribers.map((subscriber) => (
            <RecordRow
              accessibilityHint="Open subscriber details and subscription history"
              accessibilityLabel={`${subscriber.name}${subscriber.phone ? `, ${subscriber.phone}` : ""}${subscriber.email ? `, ${subscriber.email}` : ""}`}
              key={subscriber.id}
              leading={
                <RecordLeadingTile tone="neutral">
                  <ThemedText variant="label">{initialsOf(subscriber.name)}</ThemedText>
                </RecordLeadingTile>
              }
              onPress={() => router.push(subscriberDetailsHref(subscriber.id))}
            >
              <RecordTitle>{subscriber.name}</RecordTitle>
              <RecordDetail>
                {subscriber.phone ?? subscriber.email ?? "No contact details"}
              </RecordDetail>
              {subscriber.phone && subscriber.email ? <RecordDetail>{subscriber.email}</RecordDetail> : null}
            </RecordRow>
          ))}
        </View>
      )}
      <SubscriberSheet
        onClose={() => setIsAddSheetVisible(false)}
        onSaved={() => {
          setIsAddSheetVisible(false);
          void loadSubscribers();
        }}
        visible={isAddSheetVisible}
      />
    </AppScreenFrame>
  );
}
