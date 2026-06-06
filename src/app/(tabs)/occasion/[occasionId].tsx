import { useMemo } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { MemoryCard } from '@/components/memories/MemoryCard';
import { Body, Caption, Display, Title } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { findOccasionById, whenLabel } from '@/lib/occasions';
import { useAppState } from '@/state/AppState';
import { useT } from '@/i18n';

function formatLong(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function OccasionPageScreen() {
  const router = useRouter();
  const t = useT();
  const { occasionId } = useLocalSearchParams<{ occasionId: string }>();
  const { nodes, getNode, visibleMemories } = useAppState();

  const event = useMemo(
    () => (occasionId ? findOccasionById(occasionId, nodes) : undefined),
    [occasionId, nodes],
  );
  const node = event?.nodeId ? getNode(event.nodeId) : undefined;

  const relatedMemories = useMemo(() => {
    if (!event?.nodeId) return [];
    return visibleMemories.filter(
      (m) => m.nodeId === event.nodeId || m.taggedNodeIds.includes(event.nodeId!),
    );
  }, [event?.nodeId, visibleMemories]);

  if (!event) {
    return (
      <ScreenContainer showBack onBack={() => router.back()} maxWidth={640}>
        <EmptyState title={t('occasionPage.notFoundTitle')} body={t('occasionPage.notFoundBody')} />
      </ScreenContainer>
    );
  }

  const memorial = event.kind === 'death_anniversary';

  return (
    <ScreenContainer showBack onBack={() => router.back()} maxWidth={640}>
      <View style={{ gap: spacing.lg }}>
        <View style={{ alignItems: 'center', gap: spacing.md }}>
          {node ? (
            <Avatar
              name={node.displayName}
              size={88}
              memorial={memorial}
              uri={node.profile?.profilePhoto?.value ?? node.avatarUrl}
            />
          ) : (
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: radii.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.mistBeige,
              }}
            >
              <Body style={{ fontSize: 36 }}>✦</Body>
            </View>
          )}
          <Display align="center" style={{ fontSize: 30 }}>
            {event.title}
          </Display>
          <Badge label={whenLabel(event.daysUntil)} tone={event.daysUntil <= 7 ? 'gold' : 'soft'} />
          <Caption align="center">{formatLong(event.date)}</Caption>
          {event.subtitle ? <Body align="center">{event.subtitle}</Body> : null}
        </View>

        {node ? (
          <Button
            label={t('common.openLifeProfile')}
            variant="secondary"
            onPress={() => router.push({ pathname: '/node/[nodeId]', params: { nodeId: node.id } })}
          />
        ) : null}

        <Card>
          <View style={{ gap: spacing.sm }}>
            <Title>{t('occasionPage.memoriesTitle')}</Title>
            {relatedMemories.length === 0 ? (
              <Body style={{ color: colors.deepUmber }}>{t('occasionPage.memoriesEmpty')}</Body>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {relatedMemories.slice(0, 6).map((m) => (
                  <MemoryCard
                    key={m.id}
                    memory={m}
                    onOpen={() => router.push({ pathname: '/memory/[memoryId]', params: { memoryId: m.id } })}
                    getNodeName={(id) => getNode(id)?.displayName}
                  />
                ))}
              </View>
            )}
          </View>
        </Card>

        <Card style={{ backgroundColor: colors.candlelight, borderColor: colors.softGold }}>
          <View style={{ gap: spacing.sm }}>
            <Title>{t('occasionPage.guestbookTitle')}</Title>
            <Body style={{ color: colors.deepUmber }}>{t('occasionPage.guestbookBody')}</Body>
            <Badge label={t('occasionPage.guestbookSoon')} tone="gold" />
          </View>
        </Card>
      </View>
    </ScreenContainer>
  );
}
