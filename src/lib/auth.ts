import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./supabase";

export type AuthState =
  | { estado: "a_carregar" }
  | { estado: "local" }
  | { estado: "autenticado"; session: Session }
  | { estado: "anonimo" };

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>(
    isSupabaseConfigured ? { estado: "a_carregar" } : { estado: "local" },
  );

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setState(data.session ? { estado: "autenticado", session: data.session } : { estado: "anonimo" });
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(session ? { estado: "autenticado", session } : { estado: "anonimo" });
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export async function iniciarSessao(email: string, password: string): Promise<void> {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error(error.message);
}

export async function terminarSessao(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}
