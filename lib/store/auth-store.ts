"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Permission, Role, User } from "@/types";
import { ROLE_PERMISSIONS } from "@/types";
import { mockUsers } from "@/lib/mock/data";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  can: (permission: Permission) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string, _password: string) => {
        // Autenticação mockada - integrar com Supabase Auth quando configurado.
        await new Promise((r) => setTimeout(r, 500));
        const found = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!found) {
          return { success: false, error: "E-mail ou senha inválidos." };
        }
        set({ user: found, isAuthenticated: true });
        return { success: true };
      },
      logout: () => set({ user: null, isAuthenticated: false }),
      can: (permission: Permission) => {
        const role = get().user?.role as Role | undefined;
        if (!role) return false;
        return ROLE_PERMISSIONS[role].includes(permission);
      },
    }),
    { name: "ivs-auth" }
  )
);
