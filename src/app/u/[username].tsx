import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Platform, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Body, Caption, Display, Title } from '@/components/ui/Typography';
import { SocialIcon, SOCIAL_LABELS, type SocialNetwork } from '@/components/brand/SocialIcon';
import { PublicProfileCta } from '@/components/public/PublicProfileCta';
import { PublicMemoryCard } from '@/components/public/PublicMemoryCard';
import { ShareSheet } from '@/components/ui/ShareSheet';
import { colors, radii, spacing } from '@/constants/theme';
import { publicProfileUrl } from '@/constants/urls';
import { QrCodeIcon, ShareLinkIcon } from '@/components/brand/ActionIcons';
import { IconButton } from '@/components/ui/IconButton';
import { PublicProfileQrSheet } from '@/components/public/PublicProfileQrSheet';
import {
  normalizePublicUsernameParam,
  PUBLIC_PROFILE_EDITOR_PATH,
} from '@/lib/publicProfile';
import { useAppState } from '@/state/AppState';
import { getPublicProfile, type PublicProfileView } from '@/services/publicProfileService';

const SOCIAL_ORDER: SocialNetwork[] = [
  'website',
  'instagram',
  'facebook',
  'x',
  'linkedin',
  'youtube',
  'tiktok',
  'spotify',
  'whatsapp',
  'telegram',
  'github',
  'threads',
];

function resolveSocialUrl(network: SocialNetwork, value: string): string {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, '');
  switch (network) {
    case 'instagram':
      return `https://instagram.com/${handle}`;
    case 'facebook':
      return `https://facebook.com/${handle}`;
    case 'x':
      return `https://x.com/${handle}`;
    case 'linkedin':
      return `https://www.linkedin.com/in/${handle}`;
    case 'youtube':
      return `https://youtube.com/${handle}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${handle}`;
    case 'spotify':
      return v;
    case 'whatsapp':
      return `https://wa.me/${handle.replace(/[^0-9]/g, '')}`;
    case 'telegram':
      return `https://t.me/${handle}`;
    case 'github':
      return `https://github.com/${handle}`;
    case 'threads':
      return `https://www.threads.net/@${handle}`;
    default:
      return v.startsWith('http') ? v : `https://${v}`;
  }
}

async function openExternal(url: string) {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    await Linking.openURL(url);
  } catch {
    // ignore
  }
}

/**
 * Shareable public profile — reachable at /u/{username} without signing in.
 * URL follows the owner's current username; changing it updates the link.
 */
export default function PublicProfilePage() {
  const router = useRouter();
  const { username: usernameParam } = useLocalSearchParams<{ username: string }>();
  const { account, loading: authLoading } = useAppState();

  const username = useMemo(
    () => normalizePublicUsernameParam(String(usernameParam ?? '')),
    [usernameParam],
  );

  const [profile, setProfile] = useState<PublicProfileView | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const isOwner =
    !!account?.username &&
    account.username.toLowerCase() === username &&
    !authLoading;

  const loadProfile = useCallback(() => {
    if (!username) {
      setNotFound(true);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    setNotFound(false);
    setFetchError(false);
    getPublicProfile(username)
      .then((p) => {
        if (!p) setNotFound(true);
        else setProfile(p);
      })
      .catch(() => setFetchError(true))
      .finally(() => setProfileLoading(false));
  }, [username]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const waitingForOwnerCheck = notFound && authLoading;

  if (profileLoading || waitingForOwnerCheck) {
    return (
      <ScreenContainer maxWidth={640}>
        <Caption>Loading…</Caption>
      </ScreenContainer>
    );
  }

  if (fetchError) {
    return (
      <ScreenContainer maxWidth={640}>
        <EmptyState
          title="Could not load this profile"
          body="Check your connection and try again."
        />
        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          <Button label="Retry" variant="gold" onPress={loadProfile} />
        </View>
        <PublicProfileCta />
      </ScreenContainer>
    );
  }

  if (notFound || !profile) {
    return (
      <ScreenContainer maxWidth={640}>
        <EmptyState
          title="Profile unavailable"
          body={
            isOwner
              ? 'Your public profile is turned off. Turn it on from the You tab to share it.'
              : "This profile is private or doesn't exist."
          }
        />
        {isOwner ? (
          <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
            <Button
              label="Edit public profile"
              variant="gold"
              onPress={() => router.push(PUBLIC_PROFILE_EDITOR_PATH)}
            />
          </View>
        ) : null}
        <PublicProfileCta />
      </ScreenContainer>
    );
  }

  const socials = SOCIAL_ORDER.filter((n) => (profile.socialLinks[n] ?? '').trim().length > 0);

  return (
    <ScreenContainer maxWidth={640} showBack={isOwner}>
      <View style={{ marginBottom: spacing.lg }}>
        <View
          style={{
            height: 140,
            borderRadius: radii.lg,
            backgroundColor: colors.candlelight,
            borderWidth: 1,
            borderColor: colors.softGold,
            overflow: 'hidden',
          }}
        >
          {profile.bannerUrl ? (
            <Image source={{ uri: profile.bannerUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : null}
        </View>
        <View style={{ alignItems: 'center', marginTop: -44, gap: spacing.sm }}>
          <Avatar name={profile.displayName} size={88} uri={profile.avatarUrl} />
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Display style={{ fontSize: 28 }}>{profile.displayName}</Display>
            <Caption style={{ color: colors.guardianGold, fontWeight: '700' }}>@{profile.username}</Caption>
          </View>
          {profile.bio ? (
            <Body align="center" style={{ maxWidth: 420, color: colors.deepUmber }}>
              {profile.bio}
            </Body>
          ) : null}

          {socials.length > 0 ? (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: spacing.sm,
                marginTop: spacing.xs,
              }}
            >
              {socials.map((n) => (
                <Pressable
                  key={n}
                  onPress={() => openExternal(resolveSocialUrl(n, profile.socialLinks[n] as string))}
                  accessibilityRole="button"
                  accessibilityLabel={SOCIAL_LABELS[n]}
                >
                  <SocialIcon network={n} tile size={22} />
                </Pressable>
              ))}
            </View>
          ) : null}

          {isOwner ? (
            <View
              style={{
                marginTop: spacing.sm,
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                gap: spacing.md,
              }}
            >
              <Button
                label="Edit public profile"
                variant="secondary"
                fullWidth={false}
                onPress={() => router.push(PUBLIC_PROFILE_EDITOR_PATH)}
              />
              <IconButton accessibilityLabel="Share public profile link" onPress={() => setShareOpen(true)}>
                <ShareLinkIcon color={colors.guardianGold} />
              </IconButton>
              <IconButton accessibilityLabel="Show public profile QR code" onPress={() => setQrOpen(true)}>
                <QrCodeIcon color={colors.guardianGold} />
              </IconButton>
            </View>
          ) : null}
        </View>
      </View>

      {profile.showLifeProfile && profile.lifeProfileFields.length > 0 ? (
        <View style={{ marginBottom: spacing.lg, gap: spacing.sm }}>
          <Title>From their Life Profile</Title>
          <Card>
            <View style={{ gap: spacing.md }}>
              {profile.lifeProfileFields.map((f) => (
                <View key={f.key} style={{ gap: 2 }}>
                  <Caption style={{ color: colors.deepUmber, fontWeight: '700' }}>{f.label}</Caption>
                  <Body>{f.value}</Body>
                </View>
              ))}
            </View>
          </Card>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
        <Title>Shared moments</Title>
        <Badge label="Public" tone="gold" />
      </View>

      {profile.memories.length === 0 ? (
        <Card>
          <Body style={{ color: colors.deepUmber }}>Nothing shared publicly yet.</Body>
        </Card>
      ) : (
        <View style={{ gap: spacing.md }}>
          {profile.memories.map((m) => (
            <PublicMemoryCard key={m.id} memory={m} />
          ))}
        </View>
      )}

      <PublicProfileCta />

      {isOwner ? (
        <>
          <ShareSheet
            visible={shareOpen}
            onClose={() => setShareOpen(false)}
            link={publicProfileUrl(profile.username)}
            title="Share your public profile"
            message={`See ${profile.displayName}'s public profile on Tomora`}
            linkLabel="Public profile link"
            emailSubject="A Tomora public profile"
          />
          <PublicProfileQrSheet
            visible={qrOpen}
            onClose={() => setQrOpen(false)}
            username={profile.username}
            displayName={profile.displayName}
          />
        </>
      ) : null}
    </ScreenContainer>
  );
}
