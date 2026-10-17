import type { TextStyle } from "react-native";

export const type = {
  authDisplay: {
    fontSize: 48,
    lineHeight: 50,
    fontWeight: "900",
    letterSpacing: -2,
  },
  authDisplayCompact: {
    fontSize: 40,
    lineHeight: 43,
    fontWeight: "900",
    letterSpacing: -1.6,
  },
  display: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  heading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
  },
  body: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "400",
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
} as const satisfies Record<string, TextStyle>;
