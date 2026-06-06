import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { APP_BASE_URL } from '@/constants/urls';

export type AuthCallbackIntent = {
  /** Post-auth route hint — claim resumes pending invite from draft storage. */
  next?: 'claim' | 'home' | 'onboarding';
};

/** Best-effort public origin for the running app (web) or configured base URL. */
export function getAppOrigin(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return APP_BASE_URL;
}

/** Auth callback URL registered in Supabase Auth → URL configuration. */
export function getAuthCallbackUrl(intent?: AuthCallbackIntent): string {
  const params = new URLSearchParams();
  if (intent?.next) params.set('next', intent.next);
  const qs = params.toString();

  if (Platform.OS === 'web') {
    const base = `${getAppOrigin()}/auth/callback`;
    return qs ? `${base}?${qs}` : base;
  }

  const native = Linking.createURL('auth/callback');
  return qs ? `${native}${native.includes('?') ? '&' : '?'}${qs}` : native;
}

/** OAuth redirect target — same as the email-verification callback. */
export function getOAuthRedirectUrl(): string {
  return getAuthCallbackUrl();
}

/** Email confirmation redirect for sign-up and resend flows. */
export function getEmailRedirectUrl(intent?: AuthCallbackIntent): string {
  return getAuthCallbackUrl(intent);
}
