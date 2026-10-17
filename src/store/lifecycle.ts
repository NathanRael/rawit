import { create } from "zustand";

import { getLocalDate } from "@/lib/dates";
import type { LocalDate } from "@/types";

interface LifecycleClockState {
  today: LocalDate;
}

const useLifecycleClockStore = create<LifecycleClockState>(() => ({
  today: getLocalDate(),
}));

export function refreshLifecycleDate(): void {
  useLifecycleClockStore.setState({ today: getLocalDate() });
}

export function useLifecycleDate(): LocalDate {
  return useLifecycleClockStore((state) => state.today);
}
