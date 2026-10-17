import { Platform, type TextStyle } from "react-native";

type HardShadowStyle = Pick<
  TextStyle,
  "boxShadow" | "elevation" | "shadowColor" | "shadowOffset" | "shadowOpacity" | "shadowRadius"
>;

/** The hard, zero-blur physical shadow used by all raised neo-brutalist surfaces. */
export function hardShadow(pressed = false): HardShadowStyle {
  if (Platform.OS === "ios") {
    return {
      shadowColor: "#000000",
      shadowOffset: pressed ? { width: 0, height: 0 } : { width: 3, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
    };
  }

  if (Platform.OS === "android") {
    return { elevation: pressed ? 0 : 4 };
  }

  return { boxShadow: pressed ? "0 0 0 0 #000000" : "3px 4px 0 0 #000000" };
}
