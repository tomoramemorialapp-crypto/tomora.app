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
import { useAppState } from '@/state/AppState';

export default function Login() {
  const router = useRouter();
  const { signInAndLoad } = useAppState();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = /\S+@\S+\.\S+/.test(email) && password.length >= 6 && !busy;

  const onSubmit = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInAndLoad(email, password);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'We couldn’t log you in. Please try again.';
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
          <Button label={copy.login.cta} variant="gold" disabled={!canSubmit} loading={busy} onPress={onSubmit} />
          <Button
            label={copy.login.noAccount}
            variant="ghost"
            onPress={() => router.replace('/(onboarding)/add-self')}
          />
        </View>
      }
    >
      <View style={{ gap: spacing.lg }}>
        <View style={{ alignItems: 'flex-start', gap: spacing.sm }}>
          <GoldStar size={22} />
          <Display style={{ fontSize: 34 }}>{copy.login.prompt}</Display>
          <Body style={{ fontSize: 18 }}>{copy.login.body}</Body>
        </View>

        <View style={{ gap: spacing.md }}>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
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
