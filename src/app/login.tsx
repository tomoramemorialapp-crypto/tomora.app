import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { GoldStar } from '@/components/brand/GoldStar';
import { AppFooter } from '@/components/brand/AppFooter';
import { colors, spacing } from '@/constants/theme';
import { useT } from '@/i18n';
import { isEmailIdentifier, isUsernameIdentifier } from '@/lib/username';
import * as authService from '@/services/authService';
import { copy } from '@/constants/copy';
import { useAppState } from '@/state/AppState';

export default function Login() {
  const router = useRouter();
  const { signInAndLoad } = useAppState();
  const t = useT();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthBusy, setOauthBusy] = useState<'google' | 'apple' | null>(null);

  const trimmed = identifier.trim();
  const validIdentifier = isEmailIdentifier(trimmed) || isUsernameIdentifier(trimmed);
  const canSubmit = validIdentifier && password.length >= 6 && !busy;

  const onOAuth = async (provider: 'google' | 'apple') => {
    setError(null);
    setOauthBusy(provider);
    try {
      await authService.signInWithOAuth(provider);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "We couldn't log you in. Please try again.";
      setError(message);
      setOauthBusy(null);
    }
  };

  const onSubmit = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInAndLoad(trimmed, password);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "We couldn't log you in. Please try again.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer
      showBack
      footer={
        <View style={{ gap: spacing.md }}>
          <Button label={t('login.cta')} variant="gold" disabled={!canSubmit} loading={busy} onPress={onSubmit} />
          <Button
            label={copy.save.google}
            variant="secondary"
            disabled={!!oauthBusy || busy}
            loading={oauthBusy === 'google'}
            onPress={() => onOAuth('google')}
          />
          <Button
            label={copy.save.apple}
            variant="secondary"
            disabled={!!oauthBusy || busy}
            loading={oauthBusy === 'apple'}
            onPress={() => onOAuth('apple')}
          />
          <Button
            label={t('login.noAccount')}
            variant="ghost"
            onPress={() => router.replace('/(onboarding)/add-self')}
          />
          <AppFooter />
        </View>
      }
    >
      <View style={{ gap: spacing.lg }}>
        <View style={{ alignItems: 'flex-start', gap: spacing.sm }}>
          <GoldStar size={22} />
          <Display style={{ fontSize: 34 }}>{t('login.prompt')}</Display>
          <Body style={{ fontSize: 18 }}>{t('login.body')}</Body>
        </View>

        <View style={{ gap: spacing.md }}>
          <TextField
            label={t('login.identifier')}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="you@example.com or yourname"
            autoCapitalize="none"
            autoComplete="username"
          />
          <View style={{ gap: spacing.xs }}>
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              onSubmitEditing={() => canSubmit && onSubmit()}
            />
            <Button
              label={showPassword ? 'Hide password' : 'Show password'}
              variant="ghost"
              fullWidth={false}
              onPress={() => setShowPassword((s) => !s)}
            />
          </View>
        </View>

        {error ? <Caption style={{ color: colors.error, fontSize: 14 }}>{error}</Caption> : null}
      </View>
    </ScreenContainer>
  );
}
