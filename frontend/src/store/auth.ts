import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Role, User } from "../types";

interface AuthState {
  token: string | null;
  user: User | null;
  role: Role | null;
  setSession: (payload: { token: string; user: User; role: Role }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      role: null,
      setSession: ({ token, user, role }) => {
        set({ token, user, role });
      },
      logout: () => set({ role: null, user: null, token: null }),
    }),
    {
      name: "yn-employment-frontend-auth",
    },
  ),
);
