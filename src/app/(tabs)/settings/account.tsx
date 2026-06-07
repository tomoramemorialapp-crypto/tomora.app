import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Toggle } from '@/components/ui/Toggle';
import { VisibilitySelector } from '@/components/ui/VisibilitySelector';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/state/AppState';
import { useTheme, type AppearancePreference } from '@/theme';
import { useLanguage } from '@/i18n';
import { isEmailVerified, resendEmailConfirmation } from '@/services/authService';
import { publicProfileUrl } from '@/constants/urls';
import { usernameChangesRemaining } from '@/services/accountService';
import { passwordMinLengthHint, validatePasswordLength } from '@/lib/passwordPolicy';
import { openPublicProfile } from '@/lib/publicProfileNav';
import { PUBLIC_PROFILE_EDITOR_PATH } from '@/lib/publicProfile';
import { normalizeUsername } from '@/lib/username';
import { Badge } from '@/components/ui/Badge';
import { AppFooter } from '@/components/brand/AppFooter';
import type { ThemePreference, VisibilityLevel } from '@/types/models';

const THEMES: { id: AppearancePreference; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Night' },
  { id: 'system', label: 'Use system setting' },
];

function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: radii.pill,
              borderWidth: 1.5,
              borderColor: active ? colors.guardianGold : colors.mistBeige,
              backgroundColor: active ? 'rgba(184,135,47,0.12)' : colors.white,
            }}
          >
            <Body style={{ fontSize: 14, fontWeight: '600', color: active ? colors.guardianGold : colors.ink }}>
              {o.label}
            </Body>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function AccountSettings() {
  const router = useRouter();
  const {
    account,
    session,
    tree,
    updateAccountSettings,
    updateTreePrivacy,
    setUsername: applyUsername,
    updateEmail,
    updatePassword,
  } = useAppState();
  const { appearancePreference, setAppearancePreference } = useTheme();
  const { language: activeLanguage, setLanguage: applyLanguage, languages } = useLanguage();

  const [displayName, setDisplayName] = useState(account?.displayName ?? '');
  const [username, setUsernameInput] = useState(account?.username ?? '');
  const [language, setLanguage] = useState(activeLanguage);
  const [theme, setTheme] = useState<AppearancePreference>(appearancePreference);

  // Username (rate-limited, unique) saved via its own RPC-backed action.
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameMsg, setUsernameMsg] = useState<string | null>(null);
  const changesLeft = usernameChangesRemaining(account);

  const onSaveUsername = async () => {
    setSavingUsername(true);
    setUsernameMsg(null);
    try {
      await applyUsername(username);
      setUsernameMsg('Username saved.');
    } catch (e) {
      setUsernameMsg(e instanceof Error ? e.message : 'Could not save username.');
    } finally {
      setSavingUsername(false);
    }
  };

  const languageOptions = languages.map((l) => ({ id: l.code, label: l.label }));

  // Appearance applies live (and persists locally); also saved to the account.
  const onChangeAppearance = (pref: AppearancePreference) => {
    setTheme(pref);
    setAppearancePreference(pref);
    void updateAccountSettings({ themePreference: pref as ThemePreference }).catch(() => {});
  };

  // Language applies live across the UI, persists locally, and saves to the account.
  const onChangeLanguage = (code: string) => {
    setLanguage(code);
    applyLanguage(code);
    void updateAccountSettings({ language: code }).catch(() => {});
  };

  const [email, setEmail] = useState(session?.user?.email ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  const verified = isEmailVerified(session);
  const currentEmail = session?.user?.email ?? '';

  const onResendVerification = async () => {
    setResendMsg(null);
    try {
      await resendEmailConfirmation(currentEmail);
      setResendMsg('Verification email sent. Check your inbox.');
    } catch (e) {
      setResendMsg(e instanceof Error ? e.message : 'Could not send verification email.');
    }
  };

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  const [defaultVisibility, setDefaultVisibility] = useState<VisibilityLevel>(tree?.defaultVisibility ?? 'family_tree');
  const [publicSharing, setPublicSharing] = useState<boolean>(tree?.publicSharingEnabled ?? false);
  const [privacyMsg, setPrivacyMsg] = useState<string | null>(null);

  useEffect(() => {
    if (tree) {
      setDefaultVisibility(tree.defaultVisibility);
      setPublicSharing(tree.publicSharingEnabled);
    }
  }, [tree?.defaultVisibility, tree?.publicSharingEnabled]);

  const savePrivacy = async (patch: { defaultVisibility?: VisibilityLevel; publicSharingEnabled?: boolean }) => {
    const next = {
      defaultVisibility: patch.defaultVisibility ?? defaultVisibility,
      publicSharingEnabled: patch.publicSharingEnabled ?? publicSharing,
    };
    setDefaultVisibility(next.defaultVisibility);
    setPublicSharing(next.publicSharingEnabled);
    setPrivacyMsg(null);
    try {
      await updateTreePrivacy(next);
      setPrivacyMsg('Saved.');
    } catch {
      setPrivacyMsg('Could not save. Please try again.');
    }
  };

  const onSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await updateAccountSettings({ displayName });
      setProfileMsg('Saved.');
    } catch {
      setProfileMsg('Could not save. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangeEmail = async () => {
    setEmailMsg(null);
    try {
      await updateEmail(email);
      setEmailMsg('Check your inbox to confirm the new email.');
    } catch (e) {
      setEmailMsg(e instanceof Error ? e.message : 'Could not update email.');
    }
  };

  const onChangePassword = async () => {
    setPwMsg(null);
    const passwordError = validatePasswordLength(password);
    if (passwordError) {
      setPwMsg(passwordError);
      return;
    }
    try {
      await updatePassword(password);
      setPassword('');
      setPwMsg('Password updated.');
    } catch (e) {
      setPwMsg(e instanceof Error ? e.message : 'Could not update password.');
    }
  };

  return (
    <ScreenContainer maxWidth={620} showBack>
      <Display style={{ fontSize: 28, marginBottom: spacing.lg }}>Account & settings</Display>

      {/* Profile basics */}
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Profile" />
        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          <TextField label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="Your name" />
          <View style={{ gap: spacing.sm }}>
            <TextField
              label="Username"
              value={username}
              onChangeText={(v) => setUsernameInput(normalizeUsername(v))}
              placeholder="username"
              autoCapitalize="none"
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
              <Caption style={{ flex: 1 }}>
                Your unique handle for your public profile. You can change it {changesLeft} more{' '}
                {changesLeft === 1 ? 'time' : 'times'} in the next 30 days.
              </Caption>
              <Button
                label={savingUsername ? 'Saving…' : 'Save'}
                variant="secondary"
                fullWidth={false}
                disabled={savingUsername || !username || username === (account?.username ?? '')}
                onPress={onSaveUsername}
              />
            </View>
            {usernameMsg ? <Caption style={{ color: colors.deepUmber }}>{usernameMsg}</Caption> : null}
          </View>
          <Caption>Edit your photo, dates, and life details from your Life Profile.</Caption>
        </View>
      </Card>

      {/* Preferences */}
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Preferences" />
        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          <Caption style={{ color: colors.deepUmber }}>Language</Caption>
          <Chips options={languageOptions} value={language} onChange={onChangeLanguage} />
          <Caption style={{ color: colors.deepUmber, marginTop: spacing.sm }}>Appearance</Caption>
          <Chips options={THEMES} value={theme} onChange={onChangeAppearance} />
          <Caption>Choose how Tomora appears. Your memories stay warm in either light.</Caption>
        </View>
      </Card>

      {/* Privacy */}
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Privacy" />
        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          <View style={{ gap: spacing.xs }}>
            <Body style={{ fontWeight: '600' }}>Default for new content</Body>
            <Caption style={{ color: colors.deepUmber }}>
              Who can see memories and profile details you add, unless you change it per item.
            </Caption>
            <View style={{ marginTop: spacing.xs }}>
              <VisibilitySelector
                label=""
                value={defaultVisibility}
                onChange={(v) => savePrivacy({ defaultVisibility: v })}
              />
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: colors.hairline }} />

          <Toggle
            value={publicSharing}
            onValueChange={(v) => savePrivacy({ publicSharingEnabled: v })}
            label="Allow public sharing"
            description="Let people outside your Family Tree open links you explicitly make public (e.g. a memorial page). Off keeps your tree invite-only."
          />

          <View style={{ height: 1, backgroundColor: colors.hairline }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Body>Your data</Body>
            <Caption>Account-side</Caption>
          </View>

          {privacyMsg ? (
            <Caption style={{ color: colors.deepUmber }}>{privacyMsg}</Caption>
          ) : (
            <Caption>Privacy is always free. Nothing is public unless you choose to share it.</Caption>
          )}
        </View>
      </Card>

      <View style={{ marginBottom: spacing.lg, gap: spacing.xs }}>
        <Button label={savingProfile ? 'Saving…' : 'Save changes'} variant="gold" disabled={savingProfile} onPress={onSaveProfile} />
        {profileMsg ? <Caption align="center" style={{ color: colors.deepUmber }}>{profileMsg}</Caption> : null}
      </View>

      {/* Public profile — full editor lives on the You tab */}
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Public profile" />
        <Caption style={{ marginTop: 2 }}>
          A shareable page at{' '}
          {account?.username ? publicProfileUrl(account.username) : 'your username'} — banner, social links, curated
          memories, and Life Profile fields you mark public.
        </Caption>
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <Button
            label="Manage public profile"
            variant="secondary"
            onPress={() => router.push(PUBLIC_PROFILE_EDITOR_PATH)}
          />
          {account?.username && account.publicProfile.enabled ? (
            <Button
              label="View public profile"
              variant="ghost"
              fullWidth={false}
              onPress={() => openPublicProfile(router, account.username!)}
            />
          ) : null}
        </View>
      </Card>

      {/* Email + verification */}
      <Card style={{ marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <SectionHeader title="Email" />
          {currentEmail ? (
            <Badge label={verified ? 'Verified' : 'Unverified'} tone={verified ? 'gold' : 'neutral'} />
          ) : null}
        </View>
        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          {currentEmail && !verified ? (
            <View
              style={{
                gap: spacing.sm,
                padding: spacing.md,
                borderRadius: radii.md,
                backgroundColor: colors.candlelight,
                borderWidth: 1,
                borderColor: colors.softGold,
              }}
            >
              <Body style={{ color: colors.deepUmber }}>
                Confirm <Body style={{ fontWeight: '700' }}>{currentEmail}</Body> to secure your account and unlock
                invites and sharing.
              </Body>
              <Button label="Resend verification email" variant="secondary" onPress={onResendVerification} />
              {resendMsg ? <Caption>{resendMsg}</Caption> : null}
            </View>
          ) : null}
          <TextField label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />
          <Caption>Changing your email sends a confirmation link to the new address before it takes effect.</Caption>
          <Button label="Update email" variant="secondary" onPress={onChangeEmail} />
          {emailMsg ? <Caption>{emailMsg}</Caption> : null}
        </View>
      </Card>

      {/* Password */}
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Password" />
        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          <View>
            <TextField
              label="New password"
              value={password}
              onChangeText={setPassword}
              placeholder={passwordMinLengthHint()}
              autoCapitalize="none"
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={8} style={{ alignSelf: 'flex-end', marginTop: 6 }}>
              <Caption style={{ color: colors.guardianGold, fontWeight: '700' }}>{showPassword ? 'Hide' : 'Show'}</Caption>
            </Pressable>
          </View>
          <Button label="Update password" variant="secondary" onPress={onChangePassword} />
          {pwMsg ? <Caption>{pwMsg}</Caption> : null}
        </View>
      </Card>

      <AppFooter />
    </ScreenContainer>
  );
}
