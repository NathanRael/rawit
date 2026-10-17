import { useState, type ReactNode } from "react";
import { View } from "react-native";

import { AlertBox } from "@/components/AlertBox";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { FilterChip } from "@/components/FilterChip";
import { Icon } from "@/components/Icon";
import { IconButton } from "@/components/IconButton";
import { PlanCard } from "@/components/PlanCard";
import { TextField } from "@/components/TextField";
import { ThemedText } from "@/components/ThemedText";
import { hardShadow, roundedCorners } from "@/theme";

const filterOptions = ["Annual", "Monthly", "5G", "Fiber"];

function SectionTitle({ children }: { children: ReactNode }) {
  return <ThemedText variant="heading">{children}</ThemedText>;
}

export function ComponentShowcase() {
  const [selectedFilter, setSelectedFilter] = useState("Annual");
  const [selectedPlan, setSelectedPlan] = useState("Basic");
  const [interactionMessage, setInteractionMessage] = useState("");

  const showPreviewFeedback = (label: string) => {
    setInteractionMessage(`${label} · component preview`);
  };

  return (
    <View className="gap-6">
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
        {interactionMessage ? (
          <ThemedText accessibilityLiveRegion="polite" variant="caption">
            {interactionMessage}
          </ThemedText>
        ) : null}
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
            price="10.000 Ar"
            selected={selectedPlan === "Basic"}
            style={{ flex: 1 }}
            variant="basic"
          />
          <PlanCard
            features={["Premium features", "5G access", "Priority support"]}
            name="Premium"
            onPress={() => setSelectedPlan("Premium")}
            price="25.000 Ar"
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
    </View>
  );
}
