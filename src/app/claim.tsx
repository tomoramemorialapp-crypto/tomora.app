import { Redirect, useLocalSearchParams } from 'expo-router';

/** Deep link entry: /claim?code=… → onboarding claim screen. */
export default function ClaimDeepLink() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  return (
    <Redirect
      href={{
        pathname: '/(onboarding)/claim',
        params: code ? { code: String(code) } : {},
      }}
    />
  );
}
