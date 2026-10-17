import { BottomSheetTextInput, useBottomSheetInternal } from "@gorhom/bottom-sheet";
import {
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { colors, hardShadow, roundedCorners, type as typography } from "@/theme";

type TextFieldProps = Omit<TextInputProps, "style"> & {
  label: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function TextField({
  label,
  error,
  containerStyle,
  accessibilityLabel,
  accessibilityHint,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  // Inside a bottom sheet the keyboard must move the sheet, which only BottomSheetTextInput does.
  // Outside a sheet (full pages) that hook is null and a plain TextInput is used.
  const bottomSheet = useBottomSheetInternal(true);
  const InputComponent = bottomSheet ? BottomSheetTextInput : TextInput;

  return (
    <View className="gap-2" style={containerStyle}>
      <ThemedText variant="label">{label}</ThemedText>
      <InputComponent
        {...inputProps}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={
          [accessibilityHint, error ? `Error: ${error}` : undefined].filter(Boolean).join(" ") || undefined
        }
        className="min-h-12 rounded-control border-2 border-ink bg-white px-3 py-3 text-ink"
        onBlur={(event) => {
          onBlur?.(event);
        }}
        onFocus={(event) => {
          onFocus?.(event);
        }}
        placeholderTextColor={colors.placeholder}
        style={[typography.body, roundedCorners, hardShadow()]}
      />
      {error ? (
        <ThemedText accessibilityRole="alert" className="text-ink" variant="caption">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}
