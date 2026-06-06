import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { LightDivider } from '@/components/brand/LightDivider';
import { Body, Caption, Display, Title } from '@/components/ui/Typography';
import { GoldStar } from '@/components/brand/GoldStar';
import { colors, spacing } from '@/constants/theme';
import { copy } from '@/constants/copy';
import { normalizeUsername, validateUsername } from '@/lib/username';
import { useAppState } from '@/state/AppState';

export default function Save() {
  const router = useRouter();
  const { signUpAndStart } = useAppState();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState(false);

  const normalizedUsername = normalizeUsername(username);
  const usernameError = username ? validateUsername(normalizedUsername) : 'Choose a username.';
  const canSave =
    /\S+@\S+\.\S+/.test(email) && !usernameError && normalizedUsername.length > 0 && password.length >= 6 && !busy;

  const onSave = async () => {
    setError(null);
    setBusy(true);
    try {
      const { needsEmailConfirmation } = await signUpAndStart(email, password, normalizedUsername);
      if (needsEmailConfirmation) {
        setConfirmEmail(true);
      } else {
        router.push('/(onboarding)/privacy');
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  if (confirmEmail) {
    return (
      <ScreenContainer center>
        <View style={{ alignItems: 'center', gap: spacing.lg }}>
          <GoldStar size={22} />
          <Display align="center" style={{ fontSize: 32 }}>
            Check your email.
          </Display>
          <Body align="center" style={{ maxWidth: 360, fontSize: 18 }}>
            We sent a confirmation link to {email}. Confirm it and your Family Tree will be saved and waiting —
            always with you.
          </Body>
          <LightDivider width={70} />
          <Caption align="center" style={{ maxWidth: 320 }}>
            You can close this and come back any time. Your tree is kept safe until you confirm.
          </Caption>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      showBack
      footer={
        <View style={{ gap: spacing.md }}>
          <Button label="Save my Family Tree" variant="gold" disabled={!canSave} loading={busy} onPress={onSave} />
          <Button label={`${copy.save.google} · Soon`} variant="secondary" disabled />
          <Button label={`${copy.save.apple} · Soon`} variant="secondary" disabled />
        </View>
      }
    >
      <View style={{ gap: spacing.lg }}>
        <OnboardingProgress step={3} total={5} />
        <View style={{ gap: spacing.sm }}>
          <Display style={{ fontSize: 34 }}>{copy.save.prompt}</Display>
          <Body style={{ fontSize: 18 }}>{copy.save.body}</Body>
        </View>

        <View style={{ gap: spacing.md }}>
          <TextField
            label="Username"
            value={username}
            onChangeText={(v) => setUsername(normalizeUsername(v))}
            placeholder="yourname"
            autoCapitalize="none"
            autoComplete="username"
          />
          <Caption style={{ color: colors.ashTaupe, fontSize: 13, marginTop: -4 }}>
            Your unique handle for signing in and your public profile. Lowercase letters, numbers, and underscores only.
          </Caption>
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
              placeholder="At least 6 characters"
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
        </View>

        {error ? <Caption style={{ color: colors.error, fontSize: 14 }}>{error}</Caption> : null}
        <Caption style={{ color: colors.deepUmber, fontSize: 14 }}>
          Google & Apple sign-in are coming soon — continue with email for now.
        </Caption>

        <View style={{ alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm }}>
          <LightDivider width={60} />
          <Caption align="center" style={{ maxWidth: 320 }}>
            Your Family Tree is private by default. Nothing is shared unless you choose to.
          </Caption>
        </View>
      </View>
    </ScreenContainer>
  );
}
