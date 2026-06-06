import { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Body, Caption, Display, Title } from '@/components/ui/Typography';
import { MemoryCard } from '@/components/memories/MemoryCard';
import { RemembranceIcon } from '@/components/brand/OccasionIcons';
import { goBack } from '@/lib/navigation';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/state/AppState';
import { editScopeFor, formatDateValue } from '@/lib/profile';
import { getMemorialPage } from '@/services/memorialService';

function yearOf(value: unknown): number | undefined {
  const dv = value as { year?: number } | undefined;
  return dv?.year;
}

export default function MemorialPage() {
  const router = useRouter();
  const { nodeId } = useLocalSearchParams<{ nodeId: string }>();
  const { getNode, getMemoriesForNode, account } = useAppState();

  const localNode = getNode(String(nodeId));

  // External / public visitors (no local node): read via the public RPC.
  const [external, setExternal] = useState<{ node: Record<string, unknown>; memories: Record<string, unknown>[] } | null>(null);
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localNode) return;
    let alive = true;
    setLoading(true);
    getMemorialPage(String(nodeId))
      .then((r) => {
        if (alive) setExternal(r);
      })
      .catch((e) => {
        if (!alive) return;
        const msg = e instanceof Error ? e.message : 'Could not open this memorial.';
        if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('private')) setNeedsPassword(true);
        else setError(msg);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [localNode, nodeId]);

  const tryPassword = async () => {
    setError(null);
    setLoading(true);
    try {
      const r = await getMemorialPage(String(nodeId), password);
      setExternal(r);
      setNeedsPassword(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That password didn’t work.');
    } finally {
      setLoading(false);
    }
  };

  // Normalize display data from either the local node or the RPC payload.
  const display = useMemo(() => {
    if (localNode) {
      const p = localNode.profile ?? {};
      return {
        name: localNode.displayName,
        photo: p.profilePhoto?.value ?? localNode.avatarUrl,
        banner: localNode.memorialBannerUrl,
        title: localNode.memorialTitle,
        bio: localNode.memorialBio,
        alternateNames: localNode.alternateNames,
        linkLabel: localNode.memorialLinkLabel,
        linkUrl: localNode.memorialLinkUrl,
        birth: formatDateValue(p.dateOfBirth?.value),
        death: formatDateValue(p.dateOfDeath?.value),
        birthYear: yearOf(p.dateOfBirth?.value) ?? (localNode.birthDate ? new Date(localNode.birthDate).getFullYear() : undefined),
        deathYear: yearOf(p.dateOfDeath?.value) ?? (localNode.deathDate ? new Date(localNode.deathDate).getFullYear() : undefined),
        privacy: localNode.memorialPrivacy,
      };
    }
    if (external) {
      const n = external.node;
      return {
        name: String(n.display_name ?? 'In loving memory'),
        photo: (n.avatar_url as string) ?? undefined,
        banner: (n.memorial_banner_url as string) ?? undefined,
        title: (n.memorial_title as string) ?? undefined,
        bio: (n.memorial_bio as string) ?? undefined,
        alternateNames: (n.alternate_names as string[]) ?? [],
        linkLabel: (n.memorial_link_label as string) ?? undefined,
        linkUrl: (n.memorial_link_url as string) ?? undefined,
        birth: n.birth_date ? new Date(String(n.birth_date)).toLocaleDateString() : '',
        death: n.death_date ? new Date(String(n.death_date)).toLocaleDateString() : '',
        birthYear: n.birth_date ? new Date(String(n.birth_date)).getFullYear() : undefined,
        deathYear: n.death_date ? new Date(String(n.death_date)).getFullYear() : undefined,
        privacy: (n.memorial_privacy as string) ?? 'family',
      };
    }
    return null;
  }, [localNode, external]);

  if (needsPassword) {
    return (
      <ScreenContainer center maxWidth={460}>
        <Display style={{ fontSize: 24, textAlign: 'center' }}>A private memorial</Display>
        <Caption align="center" style={{ marginVertical: spacing.sm }}>
          Enter the password shared by the family to view this tribute.
        </Caption>
        <View style={{ alignSelf: 'stretch', gap: spacing.sm }}>
          <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
          {error ? <Caption style={{ color: colors.error }}>{error}</Caption> : null}
          <Button label={loading ? 'Checking…' : 'View memorial'} variant="gold" disabled={loading} onPress={tryPassword} />
        </View>
      </ScreenContainer>
    );
  }

  if (!display) {
    return (
      <ScreenContainer center>
        {loading ? (
          <Caption>Loading…</Caption>
        ) : (
          <EmptyState title="This memorial isn’t available." body={error ?? 'It may be private or not exist.'} />
        )}
      </ScreenContainer>
    );
  }

  const lifespan = display.birthYear && display.deathYear ? `${display.birthYear} – ${display.deathYear}` : display.death ? `– ${display.death}` : '';
  const age = display.birthYear && display.deathYear ? display.deathYear - display.birthYear : undefined;

  const canEdit = localNode ? (() => {
    const scope = editScopeFor(localNode, account?.id);
    return scope === 'owner' || scope === 'guardian';
  })() : false;

  const memories = localNode ? getMemoriesForNode(localNode.id) : [];

  return (
    <ScreenContainer maxWidth={680} contentStyle={{ paddingHorizontal: 0, paddingTop: 0 }}>
      {/* Banner */}
      <View style={{ height: 180, backgroundColor: colors.candlelight, position: 'relative' }}>
        {display.banner ? (
          <Image source={{ uri: display.banner }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.candlelight }} />
        )}
        <Pressable
          onPress={() => goBack(router)}
          style={{
            position: 'absolute',
            top: spacing.md,
            left: spacing.md,
            backgroundColor: 'rgba(255,255,255,0.9)',
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 999,
          }}
        >
          <Caption style={{ color: colors.deepUmber, fontWeight: '700' }}>‹ Back</Caption>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}>
        {/* Photo overlapping banner */}
        <View style={{ alignItems: 'center', marginTop: -56 }}>
          <View style={{ borderRadius: 999, borderWidth: 4, borderColor: colors.ivory }}>
            <Avatar name={display.name} size={112} memorial uri={display.photo} />
          </View>
          <Display style={{ fontSize: 30, textAlign: 'center', marginTop: spacing.sm }}>{display.name}</Display>
          {display.alternateNames && display.alternateNames.length > 0 ? (
            <Caption style={{ textAlign: 'center' }}>{display.alternateNames.join(' · ')}</Caption>
          ) : null}
          {display.title ? (
            <Caption style={{ textAlign: 'center', color: colors.guardianGold, fontWeight: '700', marginTop: 2 }}>
              {display.title}
            </Caption>
          ) : null}
          {lifespan ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>
              <RemembranceIcon size={14} />
              <Caption style={{ textAlign: 'center' }}>
                {lifespan}
                {age ? ` · ${age} years` : ''}
              </Caption>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
            <Badge label={display.privacy === 'public' ? 'Public memorial' : display.privacy === 'semi' ? 'Shared with password' : 'Family memorial'} tone="memorial" />
          </View>

          {canEdit ? (
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
              <Button
                label="Edit memorial"
                variant="secondary"
                onPress={() => router.push({ pathname: '/memorial/edit', params: { nodeId: String(nodeId) } })}
              />
            </View>
          ) : null}
        </View>

        {/* Bio */}
        {display.bio ? (
          <Card style={{ marginTop: spacing.lg }}>
            <Body>{display.bio}</Body>
          </Card>
        ) : null}

        {/* Optional link button */}
        {display.linkUrl ? (
          <View style={{ marginTop: spacing.md }}>
            <Button
              label={display.linkLabel || 'Open link'}
              variant="gold"
              onPress={() => Linking.openURL(display.linkUrl!)}
            />
          </View>
        ) : null}

        {/* Tributes / memories feed */}
        <View style={{ marginTop: spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
            <SectionHeader title="Tributes" />
            {localNode ? (
              <Pressable
                onPress={() => router.push({ pathname: '/memory/new', params: { nodeId: localNode.id } })}
                hitSlop={8}
              >
                <Caption style={{ color: colors.guardianGold, fontWeight: '700' }}>+ Add tribute</Caption>
              </Pressable>
            ) : null}
          </View>

          {localNode ? (
            memories.length === 0 ? (
              <EmptyState title="No tributes yet" body="Be the first to share a memory of them." />
            ) : (
              <View style={{ gap: spacing.md }}>
                {memories.map((m) => (
                  <MemoryCard
                    key={m.id}
                    memory={m}
                    getNodeName={(id) => getNode(id)?.displayName}
                    onOpen={() => router.push({ pathname: '/memory/[memoryId]', params: { memoryId: m.id } })}
                  />
                ))}
              </View>
            )
          ) : external && external.memories.length > 0 ? (
            <View style={{ gap: spacing.md }}>
              {external.memories.map((m, i) => (
                <Card key={(m.id as string) ?? i}>
                  {m.title ? <Title>{String(m.title)}</Title> : null}
                  {m.caption ? <Body style={{ marginTop: 4 }}>{String(m.caption)}</Body> : null}
                  {m.body ? <Body style={{ marginTop: 4 }}>{String(m.body)}</Body> : null}
                </Card>
              ))}
            </View>
          ) : (
            <EmptyState title="No tributes yet" body="Memories shared here will appear for everyone who can view this page." />
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}
