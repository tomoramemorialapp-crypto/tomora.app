import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Body, Caption, Display, Title } from '@/components/ui/Typography';
import { OAuthSignInButtons } from '@/components/auth/OAuthSignInButtons';
import { colors, radii, shadows, spacing } from '@/constants/theme';
import { passwordMeetsMinLength, passwordMinLengthHint } from '@/lib/passwordPolicy';
import { isEmailIdentifier, isUsernameIdentifier, normalizeUsername, validateUsername } from '@/lib/username';
import * as authService from '@/services/authService';
import { useAppState } from '@/state/AppState';

type EmailMode = 'signin' | 'signup';

type Props = {
  visible: boolean;
  onClose: () => void;
  onAuthed: () => void | Promise<void>;
};

export function ClaimAuthModal({ visible, onClose, onAuthed }: Props) {
  const { signInAndLoad, signUpAndStart } = useAppState();
  const [emailMode, setEmailMode] = useState<EmailMode | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState(false);

  const resetEmailForm = () => {
    setEmailMode(null);
    setError(null);
    setConfirmEmail(false);
  };

  const close = () => {
    resetEmailForm();
    onClose();
  };

  const trimmedId = identifier.trim();
  const canSignIn =
    (isEmailIdentifier(trimmedId) || isUsernameIdentifier(trimmedId)) &&
    passwordMeetsMinLength(password) &&
    !busy;
  const normalizedUsername = normalizeUsername(username);
  const usernameErr = username ? validateUsername(normalizedUsername) : 'Choose a username.';
  const canSignUp =
    /\S+@\S+\.\S+/.test(email) &&
    !usernameErr &&
    normalizedUsername.length > 0 &&
    passwordMeetsMinLength(password) &&
    !busy;

  const onSignIn = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInAndLoad(trimmedId, password);
      await onAuthed();
      close();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "We couldn't log you in. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const onSignUp = async () => {
    setError(null);
    setBusy(true);
    try {
      const { needsEmailConfirmation } = await signUpAndStart(email, password, normalizedUsername);
      if (needsEmailConfirmation) {
        setConfirmEmail(true);
      } else {
        await onAuthed();
        close();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable onPress={close} style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
        <Pressable
          onPress={(e) => e.stopPropagation?.()}
          style={[
            {
              backgroundColor: colors.paper,
              borderTopLeftRadius: radii.xl,
              borderTopRightRadius: radii.xl,
              maxHeight: '92%',
              maxWidth: 520,
              width: '100%',
              alignSelf: 'center',
            },
            shadows.soft,
          ]}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
          >
            <View style={{ gap: spacing.xs }}>
              <Title style={{ fontSize: 24 }}>Save your place in this Family Tree</Title>
              <Body style={{ color: colors.deepUmber }}>
                Sign in or create an account to claim your node. Your invite is ready and will continue after this step.
              </Body>
            </View>

            {confirmEmail ? (
              <View style={{ gap: spacing.md }}>
                <Display style={{ fontSize: 26 }}>Check your email</Display>
                <Body style={{ color: colors.deepUmber }}>
                  We sent a confirmation link to {email}. After you confirm, Tomora will claim your node automatically.
                </Body>
                <Button
                  label="Resend verification email"
                  variant="secondary"
                  onPress={async () => {
                    try {
                      await authService.resendEmailConfirmation(email, { next: 'claim' });
                    } catch (e: unknown) {
                      setError(e instanceof Error ? e.message : 'Could not resend. Please try again.');
                    }
                  }}
                />
              </View>
            ) : emailMode === null ? (
              <View style={{ gap: spacing.md }}>
                <OAuthSignInButtons intent={{ next: 'claim' }} disabled={busy} onError={setError} />
                <Button label="Continue with email" variant="gold" onPress={() => setEmailMode('signin')} />
              </View>
            ) : (
              <View style={{ gap: spacing.md }}>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Button
                    label="Sign in"
                    variant={emailMode === 'signin' ? 'gold' : 'secondary'}
                    fullWidth={false}
                    onPress={() => setEmailMode('signin')}
                  />
                  <Button
                    label="Create account"
                    variant={emailMode === 'signup' ? 'gold' : 'secondary'}
                    fullWidth={false}
                    onPress={() => setEmailMode('signup')}
                  />
                </View>

                {emailMode === 'signin' ? (
                  <>
                    <TextField
                      label="Email or username"
                      value={identifier}
                      onChangeText={setIdentifier}
                      placeholder="you@example.com or yourname"
                      autoCapitalize="none"
                    />
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
                    <Button label="Sign in" variant="gold" disabled={!canSignIn} loading={busy} onPress={onSignIn} />
                  </>
                ) : (
                  <>
                    <TextField
                      label="Username"
                      value={username}
                      onChangeText={(v) => setUsername(normalizeUsername(v))}
                      placeholder="yourname"
                      autoCapitalize="none"
                    />
                    <TextField
                      label="Email"
                      value={email}
                      onChangeText={setEmail}
                      placeholder="you@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <TextField
                      label="Password"
                      value={password}
                      onChangeText={setPassword}
                      placeholder={passwordMinLengthHint()}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <Button label="Create account" variant="gold" disabled={!canSignUp} loading={busy} onPress={onSignUp} />
                  </>
                )}
              </View>
            )}

            {error ? <Caption style={{ color: colors.error }}>{error}</Caption> : null}
            <Button label="Cancel" variant="ghost" onPress={close} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
