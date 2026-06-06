import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export interface SignUpResult {
  session: Session | null;
  needsEmailConfirmation: boolean;
}

/**
 * Sign up with email + password. If the project has email confirmation
 * disabled, a session is returned immediately; otherwise the caller should
 * prompt the user to confirm via email.
 */
export async function signUpWithEmail(email: string, password: string): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error) throw error;
  return {
    session: data.session,
    needsEmailConfirmation: !data.session,
  };
}

export async function signInWithEmail(email: string, password: string): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  if (!data.session) throw new Error('Could not start a session.');
  return data.session;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Whether the signed-in user's email has been confirmed. */
export function isEmailVerified(session: Session | null): boolean {
  const user = session?.user;
  if (!user) return false;
  return Boolean(user.email_confirmed_at || user.confirmed_at);
}

/** Resend the confirmation email for an unverified address. */
export async function resendEmailConfirmation(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
  if (error) throw error;
}

/** Re-fetch the user from Supabase to pick up a freshly-confirmed email. */
export async function refreshUser(): Promise<Session | null> {
  const { error } = await supabase.auth.refreshSession();
  if (error) {
    // fall back to current session if refresh isn't possible
    return getSession();
  }
  return getSession();
}
