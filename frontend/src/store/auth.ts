import { create } from "zustand";
import { persist } from "zustand/middleware";

import { roleUsers } from "../mock/data";
import type { Role, User } from "../types";

interface AuthState {
  token: string | null;
  user: User | null;
  role: Role | null;
  loginAsRole: (role: Role) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      role: null,
      loginAsRole: (role) => {
        set({
          role,
          user: roleUsers[role],
          token: `mock-token-${role}`,
        });
      },
      logout: () => set({ role: null, user: null, token: null }),
    }),
    {
      name: "yn-employment-frontend-auth",
    },
  ),
);
