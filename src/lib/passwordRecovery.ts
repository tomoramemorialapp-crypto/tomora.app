import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = 'tomora:password-recovery-pending';

/** In-memory flag for the current page load (survives if sessionStorage is unavailable). */
let recoveryPendingMemory = false;

/** Drop any persisted Supabase session so URL recovery tokens are not ignored. */
export function clearSupabaseAuthStorageSync(): void {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('sb-')) keys.push(key);
  }
  keys.forEach((key) => localStorage.removeItem(key));
}

/** Mark that the user opened a password-reset link and must set a new password. */
export async function markPasswordRecoveryPending(): Promise<void> {
  recoveryPendingMemory = true;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.sessionStorage.setItem(STORAGE_KEY, '1');
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY, '1');
}

export async function isPasswordRecoveryPending(): Promise<boolean> {
  if (recoveryPendingMemory) return true;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.sessionStorage.getItem(STORAGE_KEY) === '1';
  }
  return (await AsyncStorage.getItem(STORAGE_KEY)) === '1';
}

/** Synchronous check for web only — used before async hydration on cold start. */
export function isPasswordRecoveryPendingSync(): boolean {
  if (recoveryPendingMemory) return true;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.sessionStorage.getItem(STORAGE_KEY) === '1';
  }
  return false;
}

export async function clearPasswordRecoveryPending(): Promise<void> {
  recoveryPendingMemory = false;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  await AsyncStorage.removeItem(STORAGE_KEY);
}

function readUrlParams(): { search: URLSearchParams; hash: URLSearchParams; hashRaw: string } | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const search = new URLSearchParams(window.location.search.replace(/^\?/, ''));
  const hashRaw = window.location.hash.replace(/^#/, '');
  const hash = new URLSearchParams(hashRaw);
  return { search, hash, hashRaw };
}

/** True when the current URL is a Supabase password-recovery return. */
export function urlIndicatesPasswordRecovery(nextParam?: string): boolean {
  if (nextParam === 'reset-password') return true;
  const params = readUrlParams();
  if (!params) return false;
  return (
    params.hashRaw.includes('type=recovery') ||
    params.hash.get('type') === 'recovery' ||
    params.search.get('type') === 'recovery' ||
    params.search.get('next') === 'reset-password'
  );
}

/**
 * Capture recovery intent from the URL before Supabase clears hash tokens.
 * Clears any stale persisted session so recovery tokens in the URL take effect.
 */
export function capturePasswordRecoveryFromCurrentUrl(nextParam?: string): boolean {
  if (!urlIndicatesPasswordRecovery(nextParam)) return false;
  clearSupabaseAuthStorageSync();
  void markPasswordRecoveryPending();
  return true;
}

// Web cold start — Supabase often redirects to the site root (not /auth/callback) when
// the callback URL is not whitelisted; hash still carries type=recovery.
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  capturePasswordRecoveryFromCurrentUrl();
}
