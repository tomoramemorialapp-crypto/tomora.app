import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { APP_BASE_URL } from '@/constants/urls';

export { getSupabaseAuthRedirectAllowList } from '@/lib/authConfig';

export type AuthCallbackIntent = {
  /** Post-auth route hint after email link or OAuth return. */
  next?: 'claim' | 'home' | 'onboarding' | 'reset-password';
};

const LOCAL_DEV_HOSTS = new Set(['localhost', '127.0.0.1']);

/** Best-effort public origin for the running app (web) or configured base URL. */
export function getAppOrigin(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return APP_BASE_URL;
}

/**
 * Origin used in redirect URLs sent to Supabase Auth.
 * Production uses EXPO_PUBLIC_APP_URL; local dev uses the live window origin.
 */
export function getAuthRedirectOrigin(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    const current = window.location.origin.replace(/\/$/, '');
    if (LOCAL_DEV_HOSTS.has(window.location.hostname)) return current;
    if (current === APP_BASE_URL) return APP_BASE_URL;
    return current;
  }
  return APP_BASE_URL;
}

/** Auth callback URL registered in Supabase Auth → URL configuration. */
export function getAuthCallbackUrl(intent?: AuthCallbackIntent): string {
  const params = new URLSearchParams();
  if (intent?.next) params.set('next', intent.next);
  const qs = params.toString();

  if (Platform.OS === 'web') {
    const base = `${getAuthRedirectOrigin()}/auth/callback`;
    return qs ? `${base}?${qs}` : base;
  }

  const native = Linking.createURL('auth/callback');
  return qs ? `${native}${native.includes('?') ? '&' : '?'}${qs}` : native;
}

/** OAuth redirect target — same callback route as email verification. */
export function getOAuthRedirectUrl(intent?: AuthCallbackIntent): string {
  return getAuthCallbackUrl(intent);
}

/** Email confirmation redirect for sign-up and resend flows. */
export function getEmailRedirectUrl(intent?: AuthCallbackIntent): string {
  return getAuthCallbackUrl(intent);
}

/** Redirect target for password-reset emails from Supabase Auth. */
export function getPasswordResetRedirectUrl(): string {
  return getAuthCallbackUrl({ next: 'reset-password' });
}
