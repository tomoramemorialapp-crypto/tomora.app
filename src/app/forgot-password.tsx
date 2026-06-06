import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { GoldStar } from '@/components/brand/GoldStar';
import { colors, spacing } from '@/constants/theme';
import { copy } from '@/constants/copy';
import { isEmailIdentifier, isUsernameIdentifier } from '@/lib/username';
import * as authService from '@/services/authService';

export default function ForgotPassword() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const trimmed = identifier.trim();
  const valid = isEmailIdentifier(trimmed) || isUsernameIdentifier(trimmed);

  const onSubmit = async () => {
    if (!valid) return;
    setError(null);
    setBusy(true);
    try {
      await authService.requestPasswordReset(trimmed);
      setSent(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : copy.passwordReset.requestError);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <ScreenContainer center showBack>
        <View style={{ alignItems: 'center', gap: spacing.lg, maxWidth: 400 }}>
          <GoldStar size={22} />
          <Display align="center" style={{ fontSize: 32 }}>
            {copy.passwordReset.sentTitle}
          </Display>
          <Body align="center" style={{ fontSize: 18, color: colors.deepUmber }}>
            {copy.passwordReset.sentBody}
          </Body>
          <Caption align="center" style={{ color: colors.ashTaupe }}>
            {copy.passwordReset.sentHint}
          </Caption>
          <Button label="Back to sign in" variant="gold" onPress={() => router.replace('/login')} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer showBack>
      <View style={{ gap: spacing.lg }}>
        <View style={{ alignItems: 'flex-start', gap: spacing.sm }}>
          <GoldStar size={22} />
          <Display style={{ fontSize: 34 }}>{copy.passwordReset.requestTitle}</Display>
          <Body style={{ fontSize: 18 }}>{copy.passwordReset.requestBody}</Body>
        </View>

        <TextField
          label="Email or username"
          value={identifier}
          onChangeText={setIdentifier}
          placeholder="you@example.com or yourname"
          autoCapitalize="none"
          autoComplete="username"
          keyboardType="email-address"
        />

        {error ? <Caption style={{ color: colors.error, fontSize: 14 }}>{error}</Caption> : null}

        <Button
          label={busy ? 'Sending…' : copy.passwordReset.requestCta}
          variant="gold"
          disabled={!valid || busy}
          loading={busy}
          onPress={onSubmit}
        />
        <Button label="Back to sign in" variant="ghost" onPress={() => router.replace('/login')} />
      </View>
    </ScreenContainer>
  );
}
