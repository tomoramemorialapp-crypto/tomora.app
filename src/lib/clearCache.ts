import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

const TOMORA_PREFIX = 'tomora.';

function isCacheKey(key: string): boolean {
  return key.startsWith(TOMORA_PREFIX) || key.startsWith('sb-');
}

/** Ask the user to confirm before clearing local cache (always signs out). */
export function confirmClearCache(): Promise<boolean> {
  const title = 'Clear cache?';
  const message =
    'This clears cached data on this device and reloads the latest version of Tomora. You will be signed out and need to log in again. Are you sure you want to continue?';

  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Clear cache', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

/**
 * Sign out, drop local Tomora + Supabase auth storage, then send the user to
 * the welcome screen so they pick up a freshly deployed build.
 */
export async function clearAppCache(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // ignore — storage is cleared below regardless
    }
  }

  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && isCacheKey(key)) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    try {
      sessionStorage.clear();
    } catch {
      // ignore
    }
  } else {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const remove = keys.filter(isCacheKey);
      if (remove.length) await AsyncStorage.multiRemove(remove);
    } catch {
      // ignore
    }
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.replace(new URL('/welcome', window.location.origin).href);
    return;
  }

  // Native: storage is cleared; caller navigates to welcome.
}
