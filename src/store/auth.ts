import { create } from "zustand";

type AuthState = {
  ready: boolean;
  userId: string | null;
  email: string | null;
  error: string | null;
  setLoading: () => void;
  setAccount: (userId: string | null, email?: string | null) => void;
  setError: (message: string) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  ready: false,
  userId: null,
  email: null,
  error: null,
  setLoading: () => set({ ready: false, error: null }),
  setAccount: (userId, email = null) => set({ ready: true, userId, email, error: null }),
  setError: (message) => set({ ready: true, userId: null, email: null, error: message }),
}));
