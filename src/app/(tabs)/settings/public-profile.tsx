import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Toggle } from '@/components/ui/Toggle';
import { Badge } from '@/components/ui/Badge';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { SocialIcon, SOCIAL_LABELS, type SocialNetwork } from '@/components/brand/SocialIcon';
import { colors, radii, spacing } from '@/constants/theme';
import { publicProfileUrl } from '@/constants/urls';
import { useAppState } from '@/state/AppState';
import { getSignedUrl, pickMedia, uploadMedia } from '@/lib/media';
import { publicLifeProfileFields } from '@/lib/publicProfileFields';
import { setMemorySharePassword } from '@/services/publicProfileService';
import type { Memory, PublicProfileConfig, SocialLinks } from '@/types/models';

const SOCIAL_FIELDS: { key: SocialNetwork; placeholder: string }[] = [
  { key: 'website', placeholder: 'https://…' },
  { key: 'instagram', placeholder: '@handle' },
  { key: 'facebook', placeholder: 'Profile URL' },
  { key: 'x', placeholder: '@handle' },
  { key: 'linkedin', placeholder: 'Profile URL' },
  { key: 'youtube', placeholder: 'Channel URL' },
  { key: 'tiktok', placeholder: '@handle' },
  { key: 'spotify', placeholder: 'Profile/artist URL' },
  { key: 'whatsapp', placeholder: 'wa.me/… or number' },
  { key: 'telegram', placeholder: '@handle' },
  { key: 'github', placeholder: '@username' },
  { key: 'threads', placeholder: '@handle' },
];

function MemoryRow({
  memory,
  featured,
  onToggleFeatured,
  password,
  onPasswordChange,
  onSavePassword,
  savingPassword,
}: {
  memory: Memory;
  featured: boolean;
  onToggleFeatured: () => void;
  password: string;
  onPasswordChange: (v: string) => void;
  onSavePassword: () => void;
  savingPassword: boolean;
}) {
  const gated = memory.visibility === 'invite_link';
  return (
    <View
      style={{
        gap: spacing.sm,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.hairline,
      }}
    >
      <Pressable onPress={onToggleFeatured} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: featured ? colors.guardianGold : colors.mistBeige,
            backgroundColor: featured ? 'rgba(184,135,47,0.15)' : colors.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {featured ? <Caption style={{ color: colors.guardianGold, fontWeight: '800' }}>✓</Caption> : null}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Body style={{ fontWeight: '600' }}>{memory.title || 'Untitled memory'}</Body>
          <Caption style={{ color: colors.deepUmber }}>
            {memory.visibility === 'public' ? 'Public' : 'Link-shared'} ·{' '}
            {new Date(memory.createdAt).toLocaleDateString()}
          </Caption>
        </View>
        {gated ? <Badge label="Password-ready" tone="neutral" /> : null}
      </Pressable>
      {gated ? (
        <View style={{ gap: spacing.xs, paddingLeft: 30 }}>
          <TextField
            label="Share password (optional)"
            value={password}
            onChangeText={onPasswordChange}
            placeholder="Viewers enter this on your public page"
            secureTextEntry
            autoCapitalize="none"
          />
          <Button
            label={savingPassword ? 'Saving…' : 'Save password'}
            variant="ghost"
            fullWidth={false}
            disabled={savingPassword}
            onPress={onSavePassword}
          />
        </View>
      ) : null}
    </View>
  );
}

export default function PublicProfileSettings() {
  const router = useRouter();
  const { account, nodes, memories, updatePublicProfile, updateAccountSettings } = useAppState();

  const selfNode = nodes.find((n) => n.ownerAccountId === account?.id);
  const publicLifeFields = useMemo(
    () => (selfNode?.profile ? publicLifeProfileFields(selfNode.profile) : []),
    [selfNode?.profile],
  );

  const [pub, setPub] = useState<PublicProfileConfig>(
    account?.publicProfile ?? {
      enabled: false,
      bio: '',
      bannerUrl: '',
      showSocial: true,
      showMemories: true,
      showLifeProfile: true,
      featuredMemoryIds: [],
    },
  );
  const [social, setSocial] = useState<SocialLinks>(account?.socialLinks ?? {});
  const [msg, setMsg] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [savingSocial, setSavingSocial] = useState(false);
  const [memoryPasswords, setMemoryPasswords] = useState<Record<string, string>>({});
  const [savingPasswordFor, setSavingPasswordFor] = useState<string | null>(null);

  useEffect(() => {
    if (account?.publicProfile) setPub(account.publicProfile);
    if (account?.socialLinks) setSocial(account.socialLinks);
  }, [account?.publicProfile, account?.socialLinks]);

  const eligibleMemories = useMemo(
    () =>
      memories.filter(
        (m) =>
          m.createdByAccountId === account?.id &&
          (m.visibility === 'public' || m.visibility === 'invite_link') &&
          m.approvalStatus !== 'rejected',
      ),
    [memories, account?.id],
  );

  const featuredSet = useMemo(() => new Set(pub.featuredMemoryIds ?? []), [pub.featuredMemoryIds]);
  const curationActive = (pub.featuredMemoryIds ?? []).length > 0;

  const savePublic = async (patch: Partial<PublicProfileConfig>) => {
    const next = { ...pub, ...patch };
    setPub(next);
    setMsg(null);
    try {
      await updatePublicProfile(patch);
      setMsg('Saved.');
    } catch {
      setMsg('Could not save. Please try again.');
    }
  };

  const toggleFeatured = (memoryId: string) => {
    const current = new Set(pub.featuredMemoryIds ?? []);
    if (current.has(memoryId)) current.delete(memoryId);
    else current.add(memoryId);
    void savePublic({ featuredMemoryIds: [...current] });
  };

  const onUploadBanner = async () => {
    if (!account) return;
    setUploadingBanner(true);
    setMsg(null);
    try {
      const picked = await pickMedia('photo');
      if (!picked) return;
      const uploaded = await uploadMedia(account.id, picked);
      const url = await getSignedUrl(uploaded.storagePath, 60 * 60 * 24 * 365);
      if (url) await savePublic({ bannerUrl: url });
    } catch {
      setMsg('Could not upload that image.');
    } finally {
      setUploadingBanner(false);
    }
  };

  const onSaveSocial = async () => {
    setSavingSocial(true);
    setMsg(null);
    try {
      await updateAccountSettings({ socialLinks: social });
      setMsg('Social links saved.');
    } catch {
      setMsg('Could not save social links.');
    } finally {
      setSavingSocial(false);
    }
  };

  const onSaveMemoryPassword = async (memoryId: string) => {
    setSavingPasswordFor(memoryId);
    setMsg(null);
    try {
      const pw = memoryPasswords[memoryId] ?? '';
      await setMemorySharePassword(memoryId, pw.trim() || null);
      setMsg('Memory password saved.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not save password.');
    } finally {
      setSavingPasswordFor(null);
    }
  };

  const setSocialField = (key: keyof SocialLinks) => (v: string) => setSocial((p) => ({ ...p, [key]: v }));

  return (
    <ScreenContainer maxWidth={620} showBack>
      <Display style={{ fontSize: 28, marginBottom: spacing.lg }}>Public profile</Display>

      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Visibility" />
        <Caption style={{ marginTop: 2 }}>
          Your page lives at a unique link tied to your username. When you change your username, the link updates too.
        </Caption>
        <View style={{ gap: spacing.md, marginTop: spacing.md }}>
          <Toggle
            value={pub.enabled}
            onValueChange={(v) => savePublic({ enabled: v })}
            label="Make my profile public"
            description={
              account?.username
                ? `Anyone can view ${publicProfileUrl(account.username)} — no Tomora account required.`
                : 'Set a username in Account settings first.'
            }
          />
          {!account?.username ? (
            <Button
              label="Set username"
              variant="secondary"
              fullWidth={false}
              onPress={() => router.push('/settings/account')}
            />
          ) : null}
        </View>
      </Card>

      {pub.enabled ? (
        <>
          <Card style={{ marginBottom: spacing.lg }}>
            <SectionHeader title="Banner & bio" />
            <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
              <View
                style={{
                  height: 120,
                  borderRadius: radii.lg,
                  backgroundColor: colors.candlelight,
                  borderWidth: 1,
                  borderColor: colors.softGold,
                  overflow: 'hidden',
                }}
              >
                {pub.bannerUrl ? (
                  <Image source={{ uri: pub.bannerUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : null}
              </View>
              <Button
                label={uploadingBanner ? 'Uploading…' : 'Upload banner'}
                variant="secondary"
                fullWidth={false}
                disabled={uploadingBanner}
                onPress={onUploadBanner}
              />
              <TextField
                label="Short bio"
                value={pub.bio ?? ''}
                onChangeText={(v) => setPub((p) => ({ ...p, bio: v }))}
                placeholder="A line about you"
                multiline
              />
              <Button label="Save bio" variant="ghost" fullWidth={false} onPress={() => savePublic({ bio: pub.bio })} />
            </View>
          </Card>

          <Card style={{ marginBottom: spacing.lg }}>
            <SectionHeader title="Social links" />
            <Caption style={{ marginTop: 2 }}>Shown on your public page when social links are enabled.</Caption>
            <View style={{ gap: spacing.md, marginTop: spacing.md }}>
              {SOCIAL_FIELDS.map(({ key, placeholder }) => (
                <View key={key} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }}>
                  <View style={{ paddingBottom: 6 }}>
                    <SocialIcon network={key} tile size={20} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextField
                      label={SOCIAL_LABELS[key]}
                      value={social[key] ?? ''}
                      onChangeText={setSocialField(key)}
                      placeholder={placeholder}
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              ))}
            </View>
            <View style={{ marginTop: spacing.md }}>
              <Button
                label={savingSocial ? 'Saving…' : 'Save social links'}
                variant="secondary"
                fullWidth={false}
                disabled={savingSocial}
                onPress={onSaveSocial}
              />
            </View>
            <View style={{ marginTop: spacing.md }}>
              <Toggle
                value={pub.showSocial}
                onValueChange={(v) => savePublic({ showSocial: v })}
                label="Show social links on public page"
              />
            </View>
          </Card>

          <Card style={{ marginBottom: spacing.lg }}>
            <SectionHeader title="Life Profile highlights" />
            <Caption style={{ marginTop: 2 }}>
              Fields you marked <Body style={{ fontWeight: '700' }}>Public</Body> in your Life Profile can appear here.
            </Caption>
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              <Toggle
                value={pub.showLifeProfile}
                onValueChange={(v) => savePublic({ showLifeProfile: v })}
                label="Show public Life Profile fields"
              />
              {publicLifeFields.length > 0 ? (
                <View style={{ gap: spacing.xs }}>
                  {publicLifeFields.map((f) => (
                    <Caption key={f.key} style={{ color: colors.deepUmber }}>
                      · {f.label}
                    </Caption>
                  ))}
                </View>
              ) : (
                <Caption style={{ color: colors.deepUmber }}>
                  No public fields yet. Edit your Life Profile and set field visibility to Public.
                </Caption>
              )}
              {selfNode ? (
                <Button
                  label="Edit Life Profile visibility"
                  variant="ghost"
                  fullWidth={false}
                  onPress={() => router.push({ pathname: '/node/edit', params: { nodeId: selfNode.id } })}
                />
              ) : null}
            </View>
          </Card>

          <Card style={{ marginBottom: spacing.lg }}>
            <SectionHeader title="Curated memories" />
            <Caption style={{ marginTop: 2 }}>
              Choose which public or link-shared memories appear. Link-shared memories can require a password to open.
            </Caption>
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              <Toggle
                value={pub.showMemories}
                onValueChange={(v) => savePublic({ showMemories: v })}
                label="Show memories on public page"
              />
              {pub.showMemories ? (
                <>
                  <Caption style={{ color: colors.deepUmber }}>
                    {curationActive
                      ? 'Only checked memories are shown. Uncheck all to show every eligible memory.'
                      : 'Check memories to curate a subset; leave all unchecked to show every eligible memory.'}
                  </Caption>
                  {eligibleMemories.length === 0 ? (
                    <Body style={{ color: colors.deepUmber }}>No public or link-shared memories yet.</Body>
                  ) : (
                    eligibleMemories.map((m) => (
                      <MemoryRow
                        key={m.id}
                        memory={m}
                        featured={featuredSet.has(m.id)}
                        onToggleFeatured={() => toggleFeatured(m.id)}
                        password={memoryPasswords[m.id] ?? ''}
                        onPasswordChange={(v) => setMemoryPasswords((p) => ({ ...p, [m.id]: v }))}
                        onSavePassword={() => onSaveMemoryPassword(m.id)}
                        savingPassword={savingPasswordFor === m.id}
                      />
                    ))
                  )}
                </>
              ) : null}
            </View>
          </Card>

          {account?.username ? (
            <Button
              label="View public profile"
              variant="gold"
              onPress={() => router.push(`/u/${account.username}`)}
            />
          ) : null}
        </>
      ) : null}

      {msg ? <Caption style={{ color: colors.deepUmber, marginTop: spacing.sm }}>{msg}</Caption> : null}
    </ScreenContainer>
  );
}
