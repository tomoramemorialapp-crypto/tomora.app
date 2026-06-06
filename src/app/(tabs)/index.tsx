import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { MemoryThumb } from '@/components/memories/MemoryThumb';
import { GoldStar } from '@/components/brand/GoldStar';
import { BellIcon } from '@/components/brand/TabIcons';
import { Body, Caption, Display, Title } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/state/AppState';
import { useT } from '@/i18n';
import type { Memory } from '@/types/models';
import { getUpcomingEvents, whenLabel, type UpcomingEvent } from '@/lib/occasions';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const EVENT_EMOJI: Record<UpcomingEvent['kind'], string> = {
  birthday: '🎂',
  death_anniversary: '🕯️',
  wedding_anniversary: '💍',
  holiday: '✦',
};

export default function Home() {
  const router = useRouter();
  const t = useT();
  const { account, nodes, relationships, visibleMemories, getNode, unreadNotificationCount } = useAppState();

  const events = useMemo(
    () => getUpcomingEvents(nodes, { withinDays: 120, relationships }).slice(0, 6),
    [nodes, relationships],
  );

  // The feed is memories only; updates (changes, invites, requests, disputes,
  // new members) live in the Notifications tab.
  const feed = useMemo<Memory[]>(
    () =>
      [...visibleMemories]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 40),
    [visibleMemories],
  );

  const firstName = (account?.displayName ?? 'there').split(' ')[0];

  return (
    <ScreenContainer maxWidth={640}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg }}>
        <View style={{ gap: spacing.xs, flex: 1 }}>
          <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.6 }}>{t('home.welcomeBack')}</Caption>
          <Display style={{ fontSize: 34 }}>{t('home.hello', { name: firstName })}</Display>
          <Body style={{ fontSize: 17, color: colors.deepUmber }}>{t('home.subtitle')}</Body>
        </View>
        <NotificationBell
          count={unreadNotificationCount}
          onPress={() => router.push('/notifications')}
        />
      </View>

      {/* Upcoming occasions */}
      {events.length > 0 ? (
        <View style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
            <Title>{t('home.upcoming')}</Title>
            <Pressable onPress={() => router.push('/(tabs)/occasions')} hitSlop={8}>
              <Caption style={{ color: colors.guardianGold, fontWeight: '700' }}>{t('common.seeAll')} ›</Caption>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.md }}>
            {events.map((e) => (
              <Pressable
                key={e.id}
                onPress={() => e.nodeId && router.push({ pathname: '/node/[nodeId]', params: { nodeId: e.nodeId } })}
                style={{
                  width: 180,
                  padding: spacing.md,
                  borderRadius: radii.lg,
                  backgroundColor: e.kind === 'death_anniversary' ? colors.candlelight : colors.paper,
                  borderWidth: 1,
                  borderColor: e.kind === 'death_anniversary' ? colors.softGold : colors.hairline,
                  gap: 6,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Body style={{ fontSize: 20 }}>{EVENT_EMOJI[e.kind]}</Body>
                  <Badge label={whenLabel(e.daysUntil)} tone={e.daysUntil <= 1 ? 'gold' : 'soft'} />
                </View>
                <Body numberOfLines={2} style={{ fontWeight: '600' }}>{e.title}</Body>
                <Caption numberOfLines={1} style={{ color: e.scope === 'family' ? colors.guardianGold : colors.ashTaupe, fontWeight: '700' }}>
                  {e.scope === 'family' ? 'Family' : 'Holiday'}
                  {e.subtitle ? ` · ${e.subtitle}` : ''}
                </Caption>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Memories feed */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
        <Title>{t('home.forYou')}</Title>
        <GoldStar size={14} />
      </View>

      {feed.length === 0 ? (
        <Card>
          <View style={{ gap: spacing.sm }}>
            <Title>{t('home.feedEmptyTitle')}</Title>
            <Body>{t('home.feedEmptyBody')}</Body>
            <Pressable onPress={() => router.push('/(tabs)/family-tree')} hitSlop={8}>
              <Caption style={{ color: colors.guardianGold, fontWeight: '700' }}>{t('home.openTree')} ›</Caption>
            </Pressable>
          </View>
        </Card>
      ) : (
        <View style={{ gap: spacing.md }}>
          {feed.map((memory) => (
            <MemoryFeedCard
              key={memory.id}
              memory={memory}
              getNode={getNode}
              onOpen={() => router.push({ pathname: '/memory/[memoryId]', params: { memoryId: memory.id } })}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

function NotificationBell({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Notifications${count > 0 ? `, ${count} unread` : ''}`}
      hitSlop={8}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.paper,
        borderWidth: 1,
        borderColor: colors.hairline,
      }}
    >
      <BellIcon color={colors.ink} size={22} />
      {count > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 4,
            borderRadius: 9,
            backgroundColor: colors.guardianGold,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Caption style={{ color: colors.white, fontSize: 10, fontWeight: '800' }}>
            {count > 9 ? '9+' : count}
          </Caption>
        </View>
      ) : null}
    </Pressable>
  );
}

function FeedShell({
  avatarName,
  memorial,
  uri,
  leading,
  heading,
  time,
  children,
  onPress,
}: {
  avatarName: string;
  memorial?: boolean;
  uri?: string;
  /** Optional custom leading visual (e.g. a media thumbnail) replacing the avatar. */
  leading?: React.ReactNode;
  heading: string;
  time: string;
  children?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Card onPress={onPress} accessibilityLabel={heading}>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        {leading ?? <Avatar name={avatarName} size={44} memorial={memorial} uri={uri} />}
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm }}>
            <Body style={{ flex: 1, fontWeight: '600' }}>{heading}</Body>
            <Caption>{time}</Caption>
          </View>
          {children}
        </View>
      </View>
    </Card>
  );
}

function MemoryFeedCard({
  memory,
  getNode,
  onOpen,
}: {
  memory: Memory;
  getNode: (id: string) => ReturnType<typeof useAppState>['nodes'][number] | undefined;
  onOpen: () => void;
}) {
  const node = memory.nodeId ? getNode(memory.nodeId) : undefined;
  return (
    <FeedShell
      avatarName={node?.displayName ?? 'A memory'}
      memorial={node?.isLiving === false}
      uri={node?.profile?.profilePhoto?.value ?? node?.avatarUrl}
      leading={<MemoryThumb memory={memory} size={48} />}
      heading={node ? `New memory for ${node.displayName}` : 'A new memory'}
      time={timeAgo(memory.createdAt)}
      onPress={onOpen}
    >
      {memory.title ? <Body style={{ fontWeight: '600' }}>{memory.title}</Body> : null}
      {memory.body ? <Body numberOfLines={3} style={{ color: colors.deepUmber }}>{memory.body}</Body> : null}
      {memory.caption ? <Body numberOfLines={2} style={{ color: colors.deepUmber }}>{memory.caption}</Body> : null}
      <Badge label={memory.type === 'text' ? 'Story' : memory.type[0].toUpperCase() + memory.type.slice(1)} tone="soft" />
    </FeedShell>
  );
}
