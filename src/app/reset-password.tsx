import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { GoldStar } from '@/components/brand/GoldStar';
import { colors, spacing } from '@/constants/theme';
import { copy } from '@/constants/copy';
import { passwordMeetsMinLength, passwordMinLengthHint } from '@/lib/passwordPolicy';
import * as authService from '@/services/authService';
import { useAppState } from '@/state/AppState';

export default function ResetPassword() {
  const router = useRouter();
  const { session, loading, finishPasswordRecovery } = useAppState();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Recovery mode keeps loading false without hydrating — show form once session exists.
    if (loading && !session) return;
    setReady(true);
  }, [loading, session]);

  const passwordsMatch = password === confirm;
  const canSubmit = passwordMeetsMinLength(password) && passwordsMatch && !busy && !!session;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setBusy(true);
    try {
      await authService.completePasswordReset(password);
      const onboarded = await finishPasswordRecovery();
      router.replace(onboarded ? '/(tabs)' : '/welcome');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : copy.passwordReset.completeError);
    } finally {
      setBusy(false);
    }
  };

  if (!ready || loading) {
    return (
      <ScreenContainer center>
        <Caption>Preparing your reset link…</Caption>
      </ScreenContainer>
    );
  }

  if (!session) {
    return (
      <ScreenContainer center showBack>
        <View style={{ alignItems: 'center', gap: spacing.lg, maxWidth: 400 }}>
          <GoldStar size={22} />
          <Display align="center" style={{ fontSize: 30 }}>
            {copy.passwordReset.expiredTitle}
          </Display>
          <Body align="center" style={{ fontSize: 17, color: colors.deepUmber }}>
            {copy.passwordReset.expiredBody}
          </Body>
          <Button
            label="Request a new link"
            variant="gold"
            onPress={() => router.replace('/forgot-password' as Href)}
          />
          <Button label="Back to sign in" variant="ghost" onPress={() => router.replace('/login')} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer showBack>
      <View style={{ gap: spacing.lg }}>
        <View style={{ alignItems: 'flex-start', gap: spacing.sm }}>
          <GoldStar size={22} />
          <Display style={{ fontSize: 34 }}>{copy.passwordReset.completeTitle}</Display>
          <Body style={{ fontSize: 18 }}>{copy.passwordReset.completeBody}</Body>
        </View>

        <View style={{ gap: spacing.md }}>
          <View style={{ gap: spacing.xs }}>
            <TextField
              label="New password"
              value={password}
              onChangeText={setPassword}
              placeholder={passwordMinLengthHint()}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Button
              label={showPassword ? 'Hide password' : 'Show password'}
              variant="ghost"
              fullWidth={false}
              onPress={() => setShowPassword((s) => !s)}
            />
          </View>
          <TextField
            label="Confirm new password"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Re-enter your password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          {confirm.length > 0 && !passwordsMatch ? (
            <Caption style={{ color: colors.error }}>Passwords do not match.</Caption>
          ) : null}
        </View>

        {error ? <Caption style={{ color: colors.error, fontSize: 14 }}>{error}</Caption> : null}

        <Button
          label={busy ? 'Saving…' : copy.passwordReset.completeCta}
          variant="gold"
          disabled={!canSubmit}
          loading={busy}
          onPress={onSubmit}
        />
      </View>
    </ScreenContainer>
  );
}
