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
import { useAppState } from '@/state/AppState';

export default function Save() {
  const router = useRouter();
  const { signUpAndStart } = useAppState();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState(false);

  const canSave = /\S+@\S+\.\S+/.test(email) && password.length >= 6 && !busy;

  const onSave = async () => {
    setError(null);
    setNote(null);
    setBusy(true);
    try {
      const { needsEmailConfirmation } = await signUpAndStart(email, password);
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
          <Button
            label={copy.save.google}
            variant="secondary"
            onPress={() => setNote('Google & Apple sign-in are coming soon — please continue with email for now.')}
          />
          <Button
            label={copy.save.apple}
            variant="secondary"
            onPress={() => setNote('Google & Apple sign-in are coming soon — please continue with email for now.')}
          />
        </View>
      }
    >
      <View style={{ gap: spacing.lg }}>
        <OnboardingProgress step={4} total={6} />
        <View style={{ gap: spacing.sm }}>
          <Display style={{ fontSize: 34 }}>{copy.save.prompt}</Display>
          <Body style={{ fontSize: 18 }}>{copy.save.body}</Body>
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
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {error ? <Caption style={{ color: colors.error, fontSize: 14 }}>{error}</Caption> : null}
        {note ? <Caption style={{ color: colors.deepUmber, fontSize: 14 }}>{note}</Caption> : null}

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
