import { useState } from 'react';
import { View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { GoldStar } from '@/components/brand/GoldStar';
import { AppFooter } from '@/components/brand/AppFooter';
import { colors, spacing } from '@/constants/theme';
import { OAuthSignInButtons } from '@/components/auth/OAuthSignInButtons';
import { copy } from '@/constants/copy';
import { useT } from '@/i18n';
import { passwordMeetsMinLength, passwordMinLengthHint } from '@/lib/passwordPolicy';
import { formatCaughtError } from '@/lib/userErrors';
import { isEmailIdentifier, isUsernameIdentifier } from '@/lib/username';
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
  const trimmed = identifier.trim();
  const validIdentifier = isEmailIdentifier(trimmed) || isUsernameIdentifier(trimmed);
  const canSubmit = validIdentifier && passwordMeetsMinLength(password) && !busy;

  const onSubmit = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInAndLoad(trimmed, password);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      setError(formatCaughtError(e, "We couldn't log you in. Please try again.", 'auth'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer showBack>
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
              placeholder={passwordMinLengthHint()}
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
          <Button
            label={copy.login.forgotPassword}
            variant="ghost"
            fullWidth={false}
            onPress={() => router.push('/forgot-password' as Href)}
          />
        </View>

        {error ? <Caption style={{ color: colors.error, fontSize: 14 }}>{error}</Caption> : null}

        <View style={{ gap: spacing.md, marginTop: spacing.md }}>
          <Button label={t('login.cta')} variant="gold" disabled={!canSubmit} loading={busy} onPress={onSubmit} />
          <OAuthSignInButtons disabled={busy} onError={setError} />
          <Button
            label={t('login.noAccount')}
            variant="ghost"
            onPress={() => router.replace('/(onboarding)/add-self')}
          />
        </View>

        <AppFooter showLogo={false} />
      </View>
    </ScreenContainer>
  );
}
