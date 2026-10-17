import { create } from "zustand";

export type SyncStatus = "idle" | "syncing" | "offline" | "conflict";

type SyncState = {
  status: SyncStatus;
  message: string | null;
  dataVersion: number;
  setStatus: (status: SyncStatus, message?: string | null) => void;
  markDataReplaced: () => void;
};

export const useSyncStore = create<SyncState>((set) => ({
  status: "idle",
  message: null,
  dataVersion: 0,
  setStatus: (status, message = null) => set({ status, message }),
  markDataReplaced: () => set((state) => ({ dataVersion: state.dataVersion + 1 })),
}));
