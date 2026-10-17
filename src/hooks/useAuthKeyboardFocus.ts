import { useRef } from "react";
import { Platform, ScrollView, type FocusEvent } from "react-native";

import { spacing } from "@/theme";

export function useAuthKeyboardFocus() {
  const scrollRef = useRef<ScrollView>(null);

  const onInputFocus = (event: FocusEvent) => {
    if (Platform.OS === "web") {
      (event.target as unknown as HTMLElement).scrollIntoView?.({ block: "nearest" });
      return;
    }
    scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(event.target, spacing.xxl, true);
  };

  return { scrollRef, onInputFocus };
}
