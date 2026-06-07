import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import {
  getEmailRedirectUrl,
  getOAuthRedirectUrl,
  getPasswordResetRedirectUrl,
  type AuthCallbackIntent,
} from '@/lib/authRedirect';
import { validatePasswordLength } from '@/lib/passwordPolicy';
import { friendlyAuthError, userMessageFromError, USER_ERROR_MESSAGES } from '@/lib/userErrors';
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
  /** True when the email is already registered — no new confirmation is sent automatically. */
  alreadyRegistered?: boolean;
}

function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

export { friendlyAuthError } from '@/lib/userErrors';

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
  if (error) throw new Error(userMessageFromError(error, USER_ERROR_MESSAGES['auth.generic'], 'auth'));
  if (!data || typeof data !== 'string') {
    throw new Error(USER_ERROR_MESSAGES['auth.account_not_found']);
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
  intent?: AuthCallbackIntent,
): Promise<SignUpResult> {
  const passwordError = validatePasswordLength(password);
  if (passwordError) throw new Error(passwordError);

  const normalizedEmail = normalizeAuthEmail(email);
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: { username: username.toLowerCase() },
      emailRedirectTo: getEmailRedirectUrl(intent),
    },
  });
  if (error) throw new Error(friendlyAuthError(error));

  const alreadyRegistered = Boolean(data.user && data.user.identities?.length === 0);

  return {
    session: data.session,
    needsEmailConfirmation: !data.session,
    alreadyRegistered,
  };
}

export async function signInWithEmail(email: string, password: string): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error(userMessageFromError(error, USER_ERROR_MESSAGES['auth.generic'], 'auth'));
  if (!data.session) throw new Error(USER_ERROR_MESSAGES['auth.session_failed']);
  return data.session;
}

/** Sign in with an email address or Tomora username. */
export async function signInWithIdentifier(identifier: string, password: string): Promise<Session> {
  const email = await resolveLoginEmail(identifier);
  return signInWithEmail(email, password);
}

export async function signOut(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch {
    // Network or server errors can leave a stale local session — always clear on device.
    await supabase.auth.signOut({ scope: 'local' });
  }
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

/**
 * Send a password-reset link. Accepts email or Tomora username (resolved to auth email).
 * Supabase always returns success for unknown emails — we mirror that calm UX in the UI.
 */
export async function requestPasswordReset(identifier: string): Promise<void> {
  const email = await resolveLoginEmail(identifier);
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getPasswordResetRedirectUrl(),
  });
  if (error) throw new Error(friendlyAuthError(error));
}

/** Set a new password after the user opens the recovery link (requires active recovery session). */
export async function completePasswordReset(newPassword: string): Promise<Session> {
  const passwordError = validatePasswordLength(newPassword);
  if (passwordError) throw new Error(passwordError);

  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(friendlyAuthError(error));
  if (!data.user) throw new Error(USER_ERROR_MESSAGES['auth.password_reset_expired']);
  const session = await getSession();
  if (!session) throw new Error(USER_ERROR_MESSAGES['auth.password_reset_expired']);
  return session;
}

/** Resend the confirmation email for an unverified address. */
export async function resendEmailConfirmation(email: string, intent?: AuthCallbackIntent): Promise<void> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: normalizeAuthEmail(email),
    options: { emailRedirectTo: getEmailRedirectUrl(intent) },
  });
  if (error) throw new Error(friendlyAuthError(error));
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
export async function signInWithOAuth(
  provider: OAuthProvider,
  intent?: AuthCallbackIntent,
): Promise<void> {
  const redirectTo = getOAuthRedirectUrl(intent);
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
