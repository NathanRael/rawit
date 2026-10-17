import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

import { Badge } from "@/components/Badge";
import { Icon } from "@/components/Icon";
import { ThemedText } from "@/components/ThemedText";
import { colors, hardShadow, roundedCorners } from "@/theme";

type PlanCardProps = {
  name: string;
  price: string;
  features: string[];
  variant?: "basic" | "premium";
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

const planStyles = {
  basic: { header: "bg-success", badge: "bg-success" },
  premium: { header: "bg-info", badge: "bg-info" },
} as const;

export function PlanCard({
  name,
  price,
  features,
  variant = "basic",
  selected = false,
  disabled = false,
  onPress,
  style,
}: PlanCardProps) {
  const planStyle = planStyles[variant];

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`${name}, ${price} per month${selected ? ", selected" : ""}`}
      accessibilityState={onPress ? { selected, disabled } : undefined}
      className={`rounded-card border-2 border-ink bg-white ${disabled ? "opacity-50" : ""}`}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        hardShadow(pressed),
        roundedCorners,
        { transform: pressed ? [{ translateX: 2 }, { translateY: 2 }] : undefined },
        style,
      ]}
    >
      <View
        className={`rounded-t-card border-b-2 border-ink px-3 py-2 ${planStyle.header}`}
        style={roundedCorners}
      >
        <ThemedText variant="caption">{name.toUpperCase()}</ThemedText>
      </View>
      <View className="gap-3 p-3">
        <ThemedText className="text-ink" numberOfLines={1} variant="heading">
          {price}
          <ThemedText className="text-ink" variant="caption"> /mo</ThemedText>
        </ThemedText>
        <View className="gap-2">
          {features.map((feature) => (
            <View className="flex-row items-start gap-2" key={feature}>
              <Icon name="check" size={16} color={colors.ink} />
              <ThemedText className="flex-1" variant="caption">{feature}</ThemedText>
            </View>
          ))}
        </View>
        <Badge label={selected ? "Selected" : "Choose plan"} tone={selected ? variant === "basic" ? "success" : "info" : "neutral"} />
      </View>
    </Pressable>
  );
}
