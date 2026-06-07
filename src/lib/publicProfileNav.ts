import { Platform } from 'react-native';
import type { Href } from 'expo-router';

import { normalizePublicUsernameParam } from '@/lib/publicProfile';

/** Expo Router href for the root-stack public profile page (not the tabs shortcut). */
export function publicProfileHref(username: string): Href {
  const normalized = normalizePublicUsernameParam(username);
  return { pathname: '/u/[username]', params: { username: normalized } };
}

/**
 * Open a public profile. On web, use a full navigation so we leave the tabs
 * stack and avoid redirect loops with the old in-tabs /u shortcut.
 */
export function openPublicProfile(router: { push: (href: Href) => void }, username: string): void {
  const normalized = normalizePublicUsernameParam(username);
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.assign(`/u/${encodeURIComponent(normalized)}`);
    return;
  }
  router.push(publicProfileHref(username));
}
