import { Redirect, useLocalSearchParams } from 'expo-router';

/** In-app shortcut — public profiles live outside the auth-gated tabs stack. */
export default function TabPublicProfileRedirect() {
  const { username } = useLocalSearchParams<{ username: string }>();
  return <Redirect href={`/u/${encodeURIComponent(String(username ?? ''))}`} />;
}
