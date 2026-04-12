import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Role, User } from "../types";

interface AuthState {
  token: string | null;
  user: User | null;
  role: Role | null;
  setSession: (payload: { token: string; user: User; role: Role }) => void;
  loginAsRole: (role: Role) => void;
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
      loginAsRole: (role) => {
        set({
          role,
          user: {
            id: role === "enterprise" ? 3 : role === "city" ? 2 : 1,
            username: role === "enterprise" ? "enterprise_user" : role === "city" ? "city_reviewer" : "province_admin",
            name: role === "enterprise" ? "企业演示账号" : role === "city" ? "市级演示账号" : "省级演示账号",
            role,
            region: role === "province" ? "云南省" : "昆明市",
          },
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
