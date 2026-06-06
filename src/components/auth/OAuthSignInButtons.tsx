import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { OAUTH_SIGN_IN_ENABLED } from '@/constants/app';
import { copy } from '@/constants/copy';
import { spacing } from '@/constants/theme';
import type { AuthCallbackIntent } from '@/lib/authRedirect';
import * as authService from '@/services/authService';

type OAuthProvider = 'google' | 'apple';

type Props = {
  /** Post-auth route hint — e.g. onboarding save screen passes `{ next: 'onboarding' }`. */
  intent?: AuthCallbackIntent;
  /** Disable buttons while a parent form is submitting. */
  disabled?: boolean;
  onError?: (message: string) => void;
};

/**
 * Google / Apple sign-in — hidden until EXPO_PUBLIC_OAUTH_SIGN_IN_ENABLED=true.
 * Wire-up lives in authService.signInWithOAuth and /auth/callback.
 */
export function OAuthSignInButtons({ intent, disabled, onError }: Props) {
  const [oauthBusy, setOauthBusy] = useState<OAuthProvider | null>(null);

  if (!OAUTH_SIGN_IN_ENABLED) return null;

  const onOAuth = async (provider: OAuthProvider) => {
    setOauthBusy(provider);
    try {
      await authService.signInWithOAuth(provider, intent);
      // Web redirects away; native completes via exchangeCodeForSession + auth listener.
    } catch (e: unknown) {
      onError?.(e instanceof Error ? e.message : 'Could not sign in. Please try again.');
      setOauthBusy(null);
    }
  };

  const blocked = disabled || !!oauthBusy;

  return (
    <View style={{ gap: spacing.md }}>
      <Button
        label={copy.save.google}
        variant="secondary"
        disabled={blocked}
        loading={oauthBusy === 'google'}
        onPress={() => onOAuth('google')}
      />
      <Button
        label={copy.save.apple}
        variant="secondary"
        disabled={blocked}
        loading={oauthBusy === 'apple'}
        onPress={() => onOAuth('apple')}
      />
    </View>
  );
}
