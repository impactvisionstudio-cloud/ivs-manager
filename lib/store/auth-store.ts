"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Permission, Role, User } from "@/types";
import { ROLE_PERMISSIONS } from "@/types";
import { createClient } from "@/lib/supabase/client";

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
      login: async (email: string, password: string) => {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error || !data.user) {
          return { success: false, error: "E-mail ou senha inválidos." };
        }

        const profileRes = await fetch("/api/auth/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ authId: data.user.id }),
        });

        if (!profileRes.ok) {
          await supabase.auth.signOut();
          return { success: false, error: "Usuário autenticado, mas sem perfil cadastrado." };
        }

        const profile: User = await profileRes.json();
        set({ user: profile, isAuthenticated: true });
        return { success: true };
      },
      logout: () => {
        const supabase = createClient();
        supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });
      },
      can: (permission: Permission) => {
        const role = get().user?.role as Role | undefined;
        if (!role) return false;
        return ROLE_PERMISSIONS[role].includes(permission);
      },
    }),
    { name: "ivs-auth" }
  )
);