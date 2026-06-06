import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = 'tomora:password-recovery-pending';

/** Mark that the user opened a password-reset link and must set a new password. */
export async function markPasswordRecoveryPending(): Promise<void> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.sessionStorage.setItem(STORAGE_KEY, '1');
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY, '1');
}

export async function isPasswordRecoveryPending(): Promise<boolean> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.sessionStorage.getItem(STORAGE_KEY) === '1';
  }
  return (await AsyncStorage.getItem(STORAGE_KEY)) === '1';
}

/** Synchronous check for web only — used before async hydration on cold start. */
export function isPasswordRecoveryPendingSync(): boolean {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.sessionStorage.getItem(STORAGE_KEY) === '1';
  }
  return false;
}

export async function clearPasswordRecoveryPending(): Promise<void> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  await AsyncStorage.removeItem(STORAGE_KEY);
}

function readUrlParams(): { search: URLSearchParams; hash: URLSearchParams } | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const search = new URLSearchParams(window.location.search.replace(/^\?/, ''));
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return { search, hash };
}

/** True when the current URL is a Supabase password-recovery return. */
export function urlIndicatesPasswordRecovery(nextParam?: string): boolean {
  if (nextParam === 'reset-password') return true;
  const params = readUrlParams();
  if (!params) return false;
  return (
    params.hash.get('type') === 'recovery' ||
    params.search.get('type') === 'recovery' ||
    params.search.get('next') === 'reset-password'
  );
}

/**
 * Capture recovery intent from the URL before Supabase clears hash tokens.
 * Call synchronously as early as possible on any auth return route.
 */
export function capturePasswordRecoveryFromCurrentUrl(nextParam?: string): boolean {
  if (!urlIndicatesPasswordRecovery(nextParam)) return false;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.sessionStorage.setItem(STORAGE_KEY, '1');
  }
  void markPasswordRecoveryPending();
  return true;
}

// Web cold start — Supabase often redirects to the site root (not /auth/callback) when
// the callback URL is not whitelisted; hash still carries type=recovery.
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  capturePasswordRecoveryFromCurrentUrl();
}
