import { Redirect, useLocalSearchParams } from 'expo-router';

import { normalizePublicUsernameParam } from '@/lib/publicProfile';

/** In-app shortcut — public profiles live outside the auth-gated tabs stack. */
export default function TabPublicProfileRedirect() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const normalized = normalizePublicUsernameParam(String(username ?? ''));
  return <Redirect href={`/u/${encodeURIComponent(normalized)}`} />;
}
