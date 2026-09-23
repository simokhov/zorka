// Зорька. Стор сессии (Zustand). Автологин — по сохранённой сессии Supabase
// (localStorage из коробки), состояние хранит только статус и профиль.
import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

interface SessionState {
  status: AuthStatus;
  session: Session | null;
  /** Инициализация при старте приложения: подхват сохранённой сессии + подписка. */
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: "loading",
  session: null,

  initialize: async () => {
    const { data } = await supabase.auth.getSession();
    set({
      status: data.session ? "authenticated" : "anonymous",
      session: data.session,
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ status: session ? "authenticated" : "anonymous", session });
    });
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ status: "anonymous", session: null });
  },
}));
