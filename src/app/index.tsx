import { useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AlertBox,
  Badge,
  Button,
  FilterChip,
  Icon,
  IconButton,
  PlanCard,
  TextField,
  ThemedText,
} from "@/components";
import { hardShadow, roundedCorners, spacing } from "@/theme";

const filterOptions = ["Annual", "Monthly", "5G", "Fiber"];

function SectionTitle({ children }: { children: string }) {
  return <ThemedText variant="heading">{children}</ThemedText>;
}

export default function Index() {
  const [selectedFilter, setSelectedFilter] = useState("Annual");
  const [selectedPlan, setSelectedPlan] = useState("Basic");
  const [interactionMessage, setInteractionMessage] = useState("");

  const showPreviewFeedback = (label: string) => {
    setInteractionMessage(`${label} · component preview`);
  };

  return (
    <SafeAreaView
      className="flex-1 bg-canvas"
      edges={["top", "left", "right"]}
      style={{ flex: 1 }}
    >
      <ScrollView
        className="flex-1"
        style={{ flex: 1 }}
        contentContainerStyle={{
          gap: spacing.xl,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: spacing.md,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View
              className="h-12 w-12 items-center justify-center rounded-control border-2 border-ink bg-brand"
              style={roundedCorners}
            >
              <Icon name="wifi" size={24} />
            </View>
            <View>
              <ThemedText variant="heading">RAWIT</ThemedText>
              <ThemedText className="uppercase" variant="caption">
                WiFi subscriptions
              </ThemedText>
            </View>
          </View>
          <Badge label="LIGHT UI KIT" tone="info" />
        </View>

        <View className="gap-3">
          <ThemedText variant="display">WiFi, made simple.</ThemedText>
          <ThemedText className="max-w-80" variant="body">
            A bold, local-first way to keep every WiFi plan and payment in view.
          </ThemedText>
          <Button
            onPress={() => showPreviewFeedback("Add subscription")}
            title="Add subscription"
            variant="primary"
          />
          {interactionMessage ? (
            <ThemedText accessibilityLiveRegion="polite" variant="caption">
              {interactionMessage}
            </ThemedText>
          ) : null}
        </View>

        <View className="gap-4">
          <SectionTitle>Buttons & icon controls</SectionTitle>
          <View className="flex-row flex-wrap gap-3">
            <Button
              onPress={() => showPreviewFeedback("Primary button")}
              size="sm"
              title="Subscribe now"
            />
            <Button
              onPress={() => showPreviewFeedback("Secondary button")}
              size="sm"
              title="Learn more"
              variant="secondary"
            />
            <IconButton
              icon="wifi"
              label="Preview WiFi icon button"
              onPress={() => showPreviewFeedback("WiFi icon button")}
              variant="primary"
            />
            <IconButton
              icon="person"
              label="Preview profile icon button"
              onPress={() => showPreviewFeedback("Profile icon button")}
            />
          </View>
        </View>

        <View className="gap-4">
          <SectionTitle>Input fields</SectionTitle>
          <TextField
            autoCapitalize="words"
            label="Network name"
            placeholder="e.g. Studio WiFi"
            returnKeyType="done"
          />
          <TextField
            autoCapitalize="none"
            keyboardType="email-address"
            label="Contact email"
            placeholder="name@example.com"
            returnKeyType="done"
          />
        </View>

        <View className="gap-4">
          <SectionTitle>Plan cards</SectionTitle>
          <View className="flex-row gap-4">
            <PlanCard
              features={["Basic plan", "Content usage", "Reliable WiFi"]}
              name="Basic plan"
              onPress={() => setSelectedPlan("Basic")}
              price="$10"
              selected={selectedPlan === "Basic"}
              style={{ flex: 1 }}
              variant="basic"
            />
            <PlanCard
              features={["Premium features", "5G access", "Priority support"]}
              name="Premium"
              onPress={() => setSelectedPlan("Premium")}
              price="$25"
              selected={selectedPlan === "Premium"}
              style={{ flex: 1 }}
              variant="premium"
            />
          </View>
        </View>

        <View className="gap-4">
          <SectionTitle>Filter chips</SectionTitle>
          <View className="flex-row flex-wrap gap-3">
            {filterOptions.map((option) => (
              <FilterChip
                key={option}
                label={option}
                onPress={() => setSelectedFilter(option)}
                selected={selectedFilter === option}
              />
            ))}
          </View>
        </View>

        <View className="gap-4">
          <SectionTitle>Alerts & reminders</SectionTitle>
          <AlertBox
            actionLabel="Renew"
            message="A subscription is expiring soon. Review the period and renew when you are ready."
            onAction={() => showPreviewFeedback("Renew alert action")}
            title="Renew soon"
            variant="error"
          />
          <AlertBox
            message="Your payment has been recorded and the subscription is up to date."
            title="Payment successful"
            variant="success"
          />
        </View>

        <View className="gap-4">
          <SectionTitle>Status tags</SectionTitle>
          <View className="flex-row flex-wrap gap-3">
            <Badge label="Active" tone="success" />
            <Badge label="Pending" tone="warning" />
            <Badge label="Failed" tone="danger" />
            <Badge label="New" tone="info" />
            <Badge label="Renew soon" tone="danger" />
          </View>
        </View>

        <View className="gap-4">
          <SectionTitle>Quick iconography</SectionTitle>
          <View className="flex-row flex-wrap gap-3">
            {(["wifi", "plans", "chart", "calendar", "people", "bell", "settings"] as const).map(
              (icon) => (
                <View
                  className="h-14 w-14 items-center justify-center rounded-control border-2 border-ink bg-white"
                  key={icon}
                  style={[roundedCorners, hardShadow()]}
                >
                  <Icon name={icon} size={24} />
                </View>
              ),
            )}
          </View>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}
