import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { getOAuthRedirectUrl } from '@/lib/authRedirect';
import { supabase } from '@/lib/supabase';
import { isEmailIdentifier } from '@/lib/username';
import type { Session } from '@supabase/supabase-js';

export type OAuthProvider = 'google' | 'apple';

if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

export interface SignUpResult {
  session: Session | null;
  needsEmailConfirmation: boolean;
}

/**
 * Resolve an email or username to the auth email Supabase expects for sign-in.
 */
export async function resolveLoginEmail(identifier: string): Promise<string> {
  const trimmed = identifier.trim();
  if (!trimmed) throw new Error('Enter your email or username.');

  if (isEmailIdentifier(trimmed)) {
    return trimmed.toLowerCase();
  }

  const { data, error } = await supabase.rpc('resolve_login_email', { p_identifier: trimmed });
  if (error) throw new Error(error.message);
  if (!data || typeof data !== 'string') {
    throw new Error('No account found for that username or email.');
  }
  return data;
}

/**
 * Sign up with email + password. Username is stored in auth metadata and must
 * still be written to accounts via set_username once a session exists.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  username: string,
): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { username: username.toLowerCase() },
    },
  });
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

/** Sign in with an email address or Tomora username. */
export async function signInWithIdentifier(identifier: string, password: string): Promise<Session> {
  const email = await resolveLoginEmail(identifier);
  return signInWithEmail(email, password);
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
    return getSession();
  }
  return getSession();
}

/**
 * Start Google or Apple sign-in. On web the browser redirects away; on native an
 * in-app auth session completes the OAuth code exchange.
 */
export async function signInWithOAuth(provider: OAuthProvider): Promise<void> {
  const redirectTo = getOAuthRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: Platform.OS !== 'web',
    },
  });
  if (error) throw error;
  if (!data.url) throw new Error('Could not start sign-in.');

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.location.assign(data.url);
    return;
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') {
    throw new Error('Sign-in was cancelled.');
  }

  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(result.url);
  if (sessionError) throw sessionError;
}
