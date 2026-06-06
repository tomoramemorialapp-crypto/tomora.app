import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/state/AppState';
import type { MemorialPrivacy } from '@/types/models';
import { editScopeFor } from '@/lib/profile';
import { goBack } from '@/lib/navigation';
import { getSignedUrl, pickMedia, uploadMedia } from '@/lib/media';

const PRIVACY: { id: MemorialPrivacy; label: string; hint: string }[] = [
  { id: 'family', label: 'Family only', hint: 'Only your Family Tree can view it.' },
  { id: 'semi', label: 'Password', hint: 'Anyone with the link and password can view.' },
  { id: 'public', label: 'Public', hint: 'Anyone with the link can view and contribute.' },
];

export default function MemorialEdit() {
  const router = useRouter();
  const { nodeId } = useLocalSearchParams<{ nodeId: string }>();
  const { getNode, account, updateMemorialPage } = useAppState();

  const node = getNode(String(nodeId));

  const [banner, setBanner] = useState(node?.memorialBannerUrl ?? '');
  const [title, setTitle] = useState(node?.memorialTitle ?? '');
  const [alternateNames, setAlternateNames] = useState((node?.alternateNames ?? []).join(', '));
  const [bio, setBio] = useState(node?.memorialBio ?? '');
  const [linkLabel, setLinkLabel] = useState(node?.memorialLinkLabel ?? '');
  const [linkUrl, setLinkUrl] = useState(node?.memorialLinkUrl ?? '');
  const [privacy, setPrivacy] = useState<MemorialPrivacy>(node?.memorialPrivacy ?? 'family');
  const [memPassword, setMemPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!node) {
    return (
      <ScreenContainer center>
        <EmptyState title="Not found" body="This profile isn’t in your tree." />
        <Button label="Back" variant="secondary" onPress={() => goBack(router)} />
      </ScreenContainer>
    );
  }

  const scope = editScopeFor(node, account?.id);
  const canEdit = scope === 'owner' || scope === 'guardian';
  if (!canEdit) {
    return (
      <ScreenContainer center>
        <EmptyState title="You can’t edit this memorial" body="Only the family stewards can edit this page." />
        <Button label="Back" variant="secondary" onPress={() => goBack(router)} />
      </ScreenContainer>
    );
  }

  const onUploadBanner = async () => {
    setError(null);
    setUploading(true);
    try {
      const picked = await pickMedia('photo');
      if (!picked || !account) return;
      const u = await uploadMedia(account.id, picked);
      // Long-lived signed URL so the banner renders on the shareable page.
      const url = await getSignedUrl(u.storagePath, 60 * 60 * 24 * 365);
      if (url) setBanner(url);
    } catch {
      setError('Could not upload that image.');
    } finally {
      setUploading(false);
    }
  };

  const onSave = async () => {
    setBusy(true);
    setError(null);
    try {
      await updateMemorialPage(node.id, {
        memorialBannerUrl: banner.trim() || null,
        memorialTitle: title.trim() || null,
        memorialBio: bio.trim() || null,
        memorialLinkLabel: linkLabel.trim() || null,
        memorialLinkUrl: linkUrl.trim() || null,
        memorialPrivacy: privacy,
        memorialPassword: privacy === 'semi' ? memPassword.trim() || null : null,
        alternateNames: alternateNames
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      router.replace({ pathname: '/memorial/[nodeId]', params: { nodeId: node.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
      setBusy(false);
    }
  };

  return (
    <ScreenContainer
      maxWidth={620}
      showBack
      footer={<Button label={busy ? 'Saving…' : 'Save memorial'} variant="gold" disabled={busy} onPress={onSave} />}
    >
      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.6 }}>Memorial page</Caption>
          <Display style={{ fontSize: 30 }}>Edit {node.displayName}’s memorial</Display>
        </View>

        {/* Banner */}
        <Card>
          <SectionHeader title="Banner" />
          {banner ? (
            <Image source={{ uri: banner }} style={{ width: '100%', height: 140, borderRadius: radii.md, marginVertical: spacing.sm }} contentFit="cover" />
          ) : (
            <View style={{ height: 100, borderRadius: radii.md, backgroundColor: colors.candlelight, marginVertical: spacing.sm }} />
          )}
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Button label={uploading ? 'Uploading…' : 'Upload image'} variant="secondary" disabled={uploading} onPress={onUploadBanner} />
            </View>
          </View>
          <TextField label="…or image link" value={banner} onChangeText={setBanner} placeholder="https://…" autoCapitalize="none" />
        </Card>

        <TextField label="Title (e.g. “Beloved mother & teacher”)" value={title} onChangeText={setTitle} placeholder="A short title" />
        <TextField label="Also known as (comma-separated)" value={alternateNames} onChangeText={setAlternateNames} placeholder="Lola, Mommy" />
        <TextField label="Short bio / caption" value={bio} onChangeText={setBio} placeholder="A few words to remember them by…" multiline />

        {/* Optional link button */}
        <Card>
          <SectionHeader title="Optional button" />
          <Caption style={{ marginBottom: spacing.sm }}>
            Add any link — a livestream, video, donation, or fundraiser. It shows as a button on the memorial.
          </Caption>
          <TextField label="Button label" value={linkLabel} onChangeText={setLinkLabel} placeholder="Watch the service" />
          <TextField label="Button link" value={linkUrl} onChangeText={setLinkUrl} placeholder="https://…" autoCapitalize="none" />
        </Card>

        {/* Privacy */}
        <Card>
          <SectionHeader title="Who can view" />
          <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
            {PRIVACY.map((p) => {
              const active = p.id === privacy;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setPrivacy(p.id)}
                  style={{
                    padding: spacing.md,
                    borderRadius: radii.md,
                    borderWidth: 1.5,
                    borderColor: active ? colors.guardianGold : colors.mistBeige,
                    backgroundColor: active ? 'rgba(184,135,47,0.10)' : colors.white,
                  }}
                >
                  <Body style={{ fontWeight: '700', color: active ? colors.guardianGold : colors.ink }}>{p.label}</Body>
                  <Caption>{p.hint}</Caption>
                </Pressable>
              );
            })}
          </View>
          {privacy === 'semi' ? (
            <View style={{ marginTop: spacing.sm }}>
              <TextField
                label="Memorial password"
                value={memPassword}
                onChangeText={setMemPassword}
                placeholder="Set a password to share"
                autoCapitalize="none"
              />
            </View>
          ) : null}
        </Card>

        {error ? <Caption style={{ color: colors.error }}>{error}</Caption> : null}
      </View>
    </ScreenContainer>
  );
}
