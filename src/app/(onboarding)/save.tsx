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
import { OAuthSignInButtons } from '@/components/auth/OAuthSignInButtons';
import { copy } from '@/constants/copy';
import { passwordMeetsMinLength, passwordMinLengthHint } from '@/lib/passwordPolicy';
import { normalizeUsername, validateUsername } from '@/lib/username';
import * as authService from '@/services/authService';
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
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendNote, setResendNote] = useState<string | null>(null);
  const normalizedUsername = normalizeUsername(username);
  const usernameError = username ? validateUsername(normalizedUsername) : 'Choose a username.';
  const canSave =
    /\S+@\S+\.\S+/.test(email) &&
    !usernameError &&
    normalizedUsername.length > 0 &&
    passwordMeetsMinLength(password) &&
    !busy;

  const onSave = async () => {
    setError(null);
    setBusy(true);
    try {
      const { needsEmailConfirmation, alreadyRegistered: existing } = await signUpAndStart(
        email,
        password,
        normalizedUsername,
      );
      if (needsEmailConfirmation) {
        setAlreadyRegistered(!!existing);
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

  const onResend = async () => {
    setResendNote(null);
    setResendBusy(true);
    try {
      await authService.resendEmailConfirmation(email, { next: 'onboarding' });
      setResendNote('Verification email sent. Check your inbox and spam folder.');
    } catch (e: unknown) {
      setResendNote(e instanceof Error ? e.message : 'Could not resend. Please try again in a little while.');
    } finally {
      setResendBusy(false);
    }
  };

  if (confirmEmail) {
    return (
      <ScreenContainer
        center
        footer={
          <View style={{ gap: spacing.sm, width: '100%', maxWidth: 360 }}>
            <Button
              label={resendBusy ? 'Sending…' : 'Resend verification email'}
              variant="gold"
              disabled={resendBusy}
              onPress={onResend}
            />
            <Button label="Back to sign in" variant="secondary" onPress={() => router.push('/login')} />
          </View>
        }
      >
        <View style={{ alignItems: 'center', gap: spacing.lg }}>
          <GoldStar size={22} />
          <Display align="center" style={{ fontSize: 32 }}>
            Check your email.
          </Display>
          <Body align="center" style={{ maxWidth: 360, fontSize: 18 }}>
            {alreadyRegistered
              ? `If ${email} is already registered, Tomora may not send another link automatically. Use Resend below, or try signing in.`
              : `We sent a confirmation link to ${email}. Confirm it and your Family Tree will be saved and waiting — always with you.`}
          </Body>
          <LightDivider width={70} />
          <Caption align="center" style={{ maxWidth: 320 }}>
            Check spam and promotions. If nothing arrives after resending, your Supabase project may need custom SMTP
            (Authentication → SMTP) for production email delivery.
          </Caption>
          {resendNote ? <Caption style={{ color: colors.deepUmber, textAlign: 'center' }}>{resendNote}</Caption> : null}
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
          <OAuthSignInButtons
            intent={{ next: 'onboarding' }}
            disabled={busy}
            onError={setError}
          />
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
        </View>

        {error ? <Caption style={{ color: colors.error, fontSize: 14 }}>{error}</Caption> : null}

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
