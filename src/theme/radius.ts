import type { ViewStyle } from "react-native";

export const roundedCorners: Pick<ViewStyle, "borderCurve"> = {
  borderCurve: "continuous",
};

/** Same value as `--radius-card` in global.css, for styles Tailwind classes cannot reach. */
export const cardRadius = 16;
