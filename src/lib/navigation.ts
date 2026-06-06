import type { Href } from 'expo-router';

interface BackCapableRouter {
  back: () => void;
  canGoBack: () => boolean;
  replace: (href: Href) => void;
}

/**
 * Navigate to the previous screen when possible. Tab navigators default to
 * `initialRoute` back behavior (jumping to Home); `(tabs)/_layout` sets
 * `backBehavior="history"` so `router.back()` usually suffices.
 */
export function goBack(router: BackCapableRouter, pathname = ''): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  // No history (deep link, refresh, or replace-only flow) — land on a sensible tab.
  const path =
    pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
  if (path.includes('/node/') || path.includes('/memorial/') || path.includes('/relative/')) {
    router.replace('/(tabs)/family-tree');
    return;
  }
  if (path.includes('/memory/')) {
    router.replace('/(tabs)/memories');
    return;
  }
  if (path.includes('/occasion/')) {
    router.replace('/(tabs)/occasions');
    return;
  }
  if (path.includes('/settings/') || path.includes('/u/')) {
    router.replace('/(tabs)/profile');
    return;
  }
  if (path.includes('/notifications')) {
    router.replace('/(tabs)');
    return;
  }
  router.replace('/(tabs)');
}
