import { useMemo } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Body, Caption, Display, Title } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/state/AppState';
import { getUpcomingEvents, whenLabel, type UpcomingEvent } from '@/lib/occasions';

const EVENT_EMOJI: Record<UpcomingEvent['kind'], string> = {
  birthday: '🎂',
  death_anniversary: '🕯️',
  holiday: '✦',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' });
}

export default function OccasionsScreen() {
  const router = useRouter();
  const { nodes, getNode } = useAppState();
  const events = useMemo(() => getUpcomingEvents(nodes, { withinDays: 366 }), [nodes]);

  return (
    <ScreenContainer maxWidth={640}>
      <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
        <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.6 }}>Moments together</Caption>
        <Display style={{ fontSize: 32 }}>Occasions</Display>
        <Body style={{ fontSize: 17, color: colors.deepUmber }}>
          Birthdays, remembrances, and the days worth gathering for.
        </Body>
      </View>

      {events.length === 0 ? (
        <EmptyState
          title="No dates yet"
          body="Add birthdays and dates to your family's Life Profiles and they'll gather here."
        />
      ) : (
        <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
          {events.map((e) => {
            const node = e.nodeId ? getNode(e.nodeId) : undefined;
            const soon = e.daysUntil <= 7;
            return (
              <Card
                key={e.id}
                onPress={node ? () => router.push({ pathname: '/node/[nodeId]', params: { nodeId: node.id } }) : undefined}
                style={
                  e.kind === 'death_anniversary'
                    ? { backgroundColor: colors.candlelight, borderColor: colors.softGold }
                    : undefined
                }
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  {node ? (
                    <Avatar
                      name={node.displayName}
                      size={44}
                      memorial={e.kind === 'death_anniversary'}
                      uri={node.profile?.profilePhoto?.value ?? node.avatarUrl}
                    />
                  ) : (
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: radii.pill,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.mistBeige,
                      }}
                    >
                      <Body style={{ fontSize: 20 }}>{EVENT_EMOJI[e.kind]}</Body>
                    </View>
                  )}
                  <View style={{ flex: 1, gap: 2 }}>
                    <Body style={{ fontWeight: '600' }}>{e.title}</Body>
                    <Caption>
                      {formatDate(e.date)}
                      {e.subtitle ? ` · ${e.subtitle}` : ''}
                    </Caption>
                  </View>
                  <Badge label={whenLabel(e.daysUntil)} tone={soon ? 'gold' : 'soft'} />
                </View>
              </Card>
            );
          })}
        </View>
      )}

      <Card style={{ backgroundColor: colors.candlelight, borderColor: colors.softGold }}>
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Title>Occasion Pages</Title>
            <Badge label="Coming soon" tone="gold" />
          </View>
          <Body style={{ color: colors.deepUmber }}>
            Soon you'll be able to host birthdays, weddings, reunions, and remembrances — with a guestbook, shared
            memories, and gentle ways to send support.
          </Body>
        </View>
      </Card>
    </ScreenContainer>
  );
}
