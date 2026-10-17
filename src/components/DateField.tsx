import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, View } from "react-native";

import { Icon } from "@/components/Icon";
import { TextField } from "@/components/TextField";
import { ThemedText } from "@/components/ThemedText";
import { formatDateLocal, getLocalDate } from "@/lib/dates";
import { colors, hardShadow, roundedCorners, type as typography } from "@/theme";
import type { LocalDate } from "@/types";

type DateFieldProps = {
  label: string;
  /** Local calendar date in YYYY-MM-DD form. */
  value: LocalDate;
  onChange: (value: LocalDate) => void;
  onBlur?: () => void;
  error?: string;
};

function toDate(value: LocalDate): Date {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day, 12);
}

/**
 * Native date picker field. Android uses the system dialog and iOS shows an inline
 * calendar. On web, it falls back to a typed YYYY-MM-DD input.
 */
export function DateField({ label, value, onChange, onBlur, error }: DateFieldProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  if (Platform.OS === "web") {
    return (
      <TextField
        autoCapitalize="none"
        autoCorrect={false}
        error={error}
        keyboardType="numbers-and-punctuation"
        label={label}
        onBlur={onBlur}
        onChangeText={onChange}
        placeholder="YYYY-MM-DD"
        value={value}
      />
    );
  }

  const displayValue = formatDateLocal(value);
  const openPicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        display: "default",
        mode: "date",
        onValueChange: (_event, date) => onChange(getLocalDate(date)),
        value: toDate(value),
      });
      return;
    }

    setIsPickerOpen((open) => !open);
  };

  return (
    <View className="gap-2">
      <ThemedText variant="label">{label}</ThemedText>
      <Pressable
        accessibilityHint="Opens the date picker"
        accessibilityLabel={`${label}, ${displayValue}`}
        accessibilityRole="button"
        accessibilityState={Platform.OS === "ios" ? { expanded: isPickerOpen } : undefined}
        className="min-h-12 flex-row items-center justify-between gap-3 rounded-control border-2 border-ink bg-white px-3 py-3"
        onPress={openPicker}
        style={[hardShadow(), roundedCorners]}
      >
        <ThemedText style={typography.body}>{displayValue}</ThemedText>
        <Icon name="calendar" />
      </Pressable>
      {isPickerOpen && Platform.OS === "ios" ? (
        <View className="items-start rounded-control border-2 border-ink bg-white px-2 py-2">
          <DateTimePicker
            accentColor={colors.ink}
            display="inline"
            mode="date"
            onValueChange={(_event, date) => onChange(getLocalDate(date))}
            value={toDate(value)}
          />
        </View>
      ) : null}
      {error ? (
        <ThemedText accessibilityRole="alert" variant="caption">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}
