import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { UnverifiedEmailPanel } from '@/components/auth/UnverifiedEmailPanel';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { LightDivider } from '@/components/brand/LightDivider';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { colors, spacing } from '@/constants/theme';
import { OAuthSignInButtons } from '@/components/auth/OAuthSignInButtons';
import { copy } from '@/constants/copy';
import type { ExistingSignupStatus } from '@/lib/authVerification';
import { passwordMeetsMinLength, passwordMinLengthHint } from '@/lib/passwordPolicy';
import { normalizeUsername, validateUsername } from '@/lib/username';
import { formatCaughtError } from '@/lib/userErrors';
import { useAppState } from '@/state/AppState';

function verificationCopy(
  email: string,
  existingSignupStatus?: ExistingSignupStatus,
): { title: string; body: string } {
  if (existingSignupStatus === 'existing_unverified') {
    return {
      title: 'Your account is almost ready.',
      body: `Tomora already has an account for ${email}, but the email address has not been verified yet. We just sent a fresh verification link — or tap Resend below for another. Open the link to finish saving your Family Tree.`,
    };
  }
  if (existingSignupStatus === 'existing_password_mismatch') {
    return {
      title: 'This email is already registered.',
      body: `An account for ${email} already exists, but the password you entered does not match. Sign in with the password you used when you first signed up, or reset your password if you forgot it. If you never verified your email, sign in anyway — we will help you resend the link.`,
    };
  }
  return {
    title: 'Check your email.',
    body: `We sent a confirmation link to ${email}. Open it to verify your address and save your Family Tree — it will be waiting for you.`,
  };
}

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
  const [existingSignupStatus, setExistingSignupStatus] = useState<ExistingSignupStatus>('new');
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
      const result = await signUpAndStart(email, password, normalizedUsername);
      if (result.needsEmailConfirmation) {
        setExistingSignupStatus(result.existingSignupStatus ?? (result.alreadyRegistered ? 'existing_unverified' : 'new'));
        setConfirmEmail(true);
      } else {
        router.push('/(onboarding)/privacy');
      }
    } catch (e: unknown) {
      setError(formatCaughtError(e, 'Something went wrong. Please try again.', 'auth'));
    } finally {
      setBusy(false);
    }
  };

  if (confirmEmail) {
    const { title, body } = verificationCopy(email, existingSignupStatus);
    return (
      <ScreenContainer center scroll>
        <UnverifiedEmailPanel
          email={email.trim().toLowerCase()}
          intent={{ next: 'onboarding' }}
          title={title}
          body={body}
          secondaryAction={{ label: 'Go to sign in', onPress: () => router.push('/login') }}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      showBack
      footer={
        <View style={{ gap: spacing.md }}>
          <Button label="Save my Family Tree" variant="gold" disabled={!canSave} loading={busy} onPress={onSave} />
          <OAuthSignInButtons intent={{ next: 'onboarding' }} disabled={busy} onError={setError} />
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
            Already started but did not verify yet? Enter the same email and password here — we will send a fresh
            verification link.
          </Caption>
          <Caption align="center" style={{ maxWidth: 320 }}>
            Your Family Tree is private by default. Nothing is shared unless you choose to.
          </Caption>
        </View>
      </View>
    </ScreenContainer>
  );
}
