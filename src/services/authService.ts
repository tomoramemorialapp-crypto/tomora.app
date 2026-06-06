import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import {
  getEmailRedirectUrl,
  getOAuthRedirectUrl,
  getPasswordResetRedirectUrl,
  type AuthCallbackIntent,
} from '@/lib/authRedirect';
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

/** Turn Supabase auth errors into calm, actionable copy. */
export function friendlyAuthError(error: unknown): string {
  if (!(error instanceof Error)) return 'Something went wrong. Please try again.';
  const msg = error.message.toLowerCase();
  if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
    return 'Too many verification emails were sent recently. Wait about an hour, then use Resend below — or check spam.';
  }
  if (msg.includes('error sending confirmation mail') || msg.includes('error sending confirmation email')) {
    return 'Tomora could not send the verification email. Your Supabase project needs custom SMTP configured (see Supabase → Auth → SMTP).';
  }
  if (msg.includes('email address not authorized')) {
    return 'This email address cannot receive messages from the default Supabase mailer. Set up custom SMTP in your Supabase project, or sign up with an email on your Supabase org team.';
  }
  if (msg.includes('recovery email') || msg.includes('reset password')) {
    return 'Could not send the reset email. Check your SMTP settings in Supabase, or try again in a few minutes.';
  }
  return error.message;
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
  intent?: AuthCallbackIntent,
): Promise<SignUpResult> {
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
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(friendlyAuthError(error));
  if (!data.user) throw new Error('Could not update your password. Please try again.');
  const session = await getSession();
  if (!session) throw new Error('Your reset link may have expired. Request a new one.');
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
