import { Platform } from 'react-native';

/** True when the current web URL carries Supabase auth return params (PKCE code, hash tokens, or errors). */
export function urlHasSupabaseAuthReturn(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;

  const search = new URLSearchParams(window.location.search.replace(/^\?/, ''));
  const hashRaw = window.location.hash.replace(/^#/, '');
  const hash = new URLSearchParams(hashRaw);

  if (search.get('code')) return true;
  if (search.get('error') || search.get('error_description')) return true;
  if (hash.get('access_token') || hash.get('refresh_token')) return true;
  if (hash.get('error') || hash.get('error_description')) return true;
  if (search.get('type') === 'signup' || hash.get('type') === 'signup') return true;

  return false;
}

/**
 * When Supabase Site URL points at `/` (not `/auth/callback`), verification links land on
 * the app root with tokens in the hash. Forward them to the callback route on web.
 */
export function redirectAuthReturnToCallbackIfNeeded(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  if (!urlHasSupabaseAuthReturn()) return false;

  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/auth/callback') return false;

  const target = `/auth/callback${window.location.search}${window.location.hash}`;
  window.location.replace(target);
  return true;
}
