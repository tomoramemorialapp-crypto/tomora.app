import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/state/AppState';
import type { SocialLinks, ThemePreference } from '@/types/models';

const LANGUAGES: { id: string; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'fil', label: 'Filipino' },
  { id: 'es', label: 'Español' },
  { id: 'ja', label: '日本語' },
  { id: 'zh', label: '中文' },
  { id: 'fr', label: 'Français' },
];

const THEMES: { id: ThemePreference; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
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
  const { account, session, updateAccountSettings, updateEmail, updatePassword } = useAppState();

  const [displayName, setDisplayName] = useState(account?.displayName ?? '');
  const [username, setUsername] = useState(account?.username ?? '');
  const [language, setLanguage] = useState(account?.language ?? 'en');
  const [theme, setTheme] = useState<ThemePreference>(account?.themePreference ?? 'system');
  const [social, setSocial] = useState<SocialLinks>(account?.socialLinks ?? {});

  const [email, setEmail] = useState(session?.user?.email ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  const setSocialField = (key: keyof SocialLinks) => (v: string) => setSocial((p) => ({ ...p, [key]: v }));

  const onSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await updateAccountSettings({ displayName, username, language, themePreference: theme, socialLinks: social });
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
    if (password.length < 8) {
      setPwMsg('Use at least 8 characters.');
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

  const themeNote =
    theme === 'dark' ? 'Dark theme is rolling out — your preference is saved.' : undefined;

  return (
    <ScreenContainer maxWidth={620} showBack onBack={() => router.back()}>
      <Display style={{ fontSize: 28, marginBottom: spacing.lg }}>Account & settings</Display>

      {/* Profile basics */}
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Profile" />
        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          <TextField label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="Your name" />
          <TextField label="Username" value={username} onChangeText={setUsername} placeholder="username" autoCapitalize="none" />
          <Caption>Edit your photo, dates, and life details from your Life Profile.</Caption>
        </View>
      </Card>

      {/* Preferences */}
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Preferences" />
        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          <Caption style={{ color: colors.deepUmber }}>Language</Caption>
          <Chips options={LANGUAGES} value={language} onChange={setLanguage} />
          <Caption style={{ color: colors.deepUmber, marginTop: spacing.sm }}>Appearance</Caption>
          <Chips options={THEMES} value={theme} onChange={setTheme} />
          {themeNote ? <Caption>{themeNote}</Caption> : null}
        </View>
      </Card>

      {/* Social links */}
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Social links" />
        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          <TextField label="Website" value={social.website ?? ''} onChangeText={setSocialField('website')} placeholder="https://…" autoCapitalize="none" />
          <TextField label="Instagram" value={social.instagram ?? ''} onChangeText={setSocialField('instagram')} placeholder="@handle" autoCapitalize="none" />
          <TextField label="Facebook" value={social.facebook ?? ''} onChangeText={setSocialField('facebook')} placeholder="Profile URL" autoCapitalize="none" />
          <TextField label="X" value={social.x ?? ''} onChangeText={setSocialField('x')} placeholder="@handle" autoCapitalize="none" />
          <TextField label="LinkedIn" value={social.linkedin ?? ''} onChangeText={setSocialField('linkedin')} placeholder="Profile URL" autoCapitalize="none" />
        </View>
      </Card>

      <View style={{ marginBottom: spacing.lg, gap: spacing.xs }}>
        <Button label={savingProfile ? 'Saving…' : 'Save changes'} variant="gold" disabled={savingProfile} onPress={onSaveProfile} />
        {profileMsg ? <Caption align="center" style={{ color: colors.deepUmber }}>{profileMsg}</Caption> : null}
      </View>

      {/* Email */}
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Email" />
        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          <TextField label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />
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
              placeholder="At least 8 characters"
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
    </ScreenContainer>
  );
}
