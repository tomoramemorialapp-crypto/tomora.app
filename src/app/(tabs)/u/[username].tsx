import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Body, Caption, Display, Title } from '@/components/ui/Typography';
import { SocialIcon, SOCIAL_LABELS, type SocialNetwork } from '@/components/brand/SocialIcon';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/state/AppState';
import { getPublicProfile, type PublicProfileView } from '@/services/publicProfileService';

const SOCIAL_ORDER: SocialNetwork[] = [
  'website', 'instagram', 'facebook', 'x', 'linkedin', 'youtube', 'tiktok', 'spotify', 'whatsapp', 'telegram', 'github', 'threads',
];

/** Best-effort URL for a stored handle/value. */
function resolveSocialUrl(network: SocialNetwork, value: string): string {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, '');
  switch (network) {
    case 'instagram': return `https://instagram.com/${handle}`;
    case 'facebook': return `https://facebook.com/${handle}`;
    case 'x': return `https://x.com/${handle}`;
    case 'linkedin': return `https://www.linkedin.com/in/${handle}`;
    case 'youtube': return `https://youtube.com/${handle}`;
    case 'tiktok': return `https://www.tiktok.com/@${handle}`;
    case 'spotify': return v;
    case 'whatsapp': return `https://wa.me/${handle.replace(/[^0-9]/g, '')}`;
    case 'telegram': return `https://t.me/${handle}`;
    case 'github': return `https://github.com/${handle}`;
    case 'threads': return `https://www.threads.net/@${handle}`;
    default: return v.startsWith('http') ? v : `https://${v}`;
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
 * A user's shareable public (social) profile — page name is their username,
 * styled like the memorial layout. Only the owner-selected data is shown. This
 * is separate from the private Life Profile node in the Family Tree.
 */
export default function PublicProfileScreen() {
  const router = useRouter();
  const { username } = useLocalSearchParams<{ username: string }>();
  const { account } = useAppState();

  const [profile, setProfile] = useState<PublicProfileView | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isOwner = !!account?.username && account.username.toLowerCase() === String(username ?? '').toLowerCase();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNotFound(false);
    getPublicProfile(String(username ?? ''))
      .then((p) => {
        if (!alive) return;
        if (!p) setNotFound(true);
        else setProfile(p);
      })
      .catch(() => alive && setNotFound(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [username]);

  if (loading) {
    return (
      <ScreenContainer maxWidth={620} showBack>
        <Caption>Loading…</Caption>
      </ScreenContainer>
    );
  }

  if (notFound || !profile) {
    return (
      <ScreenContainer maxWidth={620} showBack>
        <EmptyState
          title="Profile unavailable"
          body={
            isOwner
              ? 'Your public profile is turned off. Turn it on in Account settings to share it.'
              : "This profile is private or doesn't exist."
          }
        />
        {isOwner ? (
          <View style={{ marginTop: spacing.lg }}>
            <Button label="Edit public profile" variant="gold" onPress={() => router.push('/settings/account')} />
          </View>
        ) : null}
      </ScreenContainer>
    );
  }

  const socials = SOCIAL_ORDER.filter((n) => (profile.socialLinks[n] ?? '').trim().length > 0);

  return (
    <ScreenContainer maxWidth={640} showBack>
      {/* Banner + avatar header */}
      <View style={{ marginBottom: spacing.lg }}>
        <View
          style={{
            height: 120,
            borderRadius: radii.lg,
            backgroundColor: colors.candlelight,
            borderWidth: 1,
            borderColor: colors.softGold,
            overflow: 'hidden',
          }}
        />
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

          {/* Social row */}
          {socials.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xs }}>
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
            <View style={{ marginTop: spacing.sm }}>
              <Button label="Edit public profile" variant="secondary" fullWidth={false} onPress={() => router.push('/settings/account')} />
            </View>
          ) : null}
        </View>
      </View>

      {/* Public memories feed */}
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
            <Card key={m.id}>
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Title style={{ flex: 1, fontSize: 18 }}>{m.title || 'A memory'}</Title>
                  <Caption>{new Date(m.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Caption>
                </View>
                {m.caption ? <Body style={{ color: colors.deepUmber }}>{m.caption}</Body> : null}
                {m.type === 'link' && m.mediaUrl ? (
                  <Pressable onPress={() => openExternal(m.mediaUrl as string)}>
                    <Caption numberOfLines={1} style={{ color: colors.guardianGold, fontWeight: '700' }}>
                      {m.mediaUrl} ›
                    </Caption>
                  </Pressable>
                ) : null}
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}
