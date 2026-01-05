import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export interface AuthResult {
  success: boolean;
  error: string | null;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
}

export async function signUp(
  email: string,
  password: string,
  metadata?: Record<string, unknown>
): Promise<AuthResult> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });

  return {
    success: !error,
    error: error?.message || null,
  };
}

export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return {
    success: !error,
    error: error?.message || null,
  };
}

export async function signInWithGoogle(): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  });

  return {
    success: !error,
    error: error?.message || null,
  };
}

export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();

  return {
    success: !error,
    error: error?.message || null,
  };
}

export async function resetPassword(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  return {
    success: !error,
    error: error?.message || null,
  };
}

export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return {
    success: !error,
    error: error?.message || null,
  };
}

export async function getCurrentSession(): Promise<AuthState> {
  const { data } = await supabase.auth.getSession();

  return {
    user: data.session?.user || null,
    session: data.session,
  };
}

export function onAuthStateChange(
  callback: (state: AuthState) => void
): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback({
      user: session?.user || null,
      session,
    });
  });

  return () => data.subscription.unsubscribe();
}
