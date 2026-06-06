import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { GoldStar } from '@/components/brand/GoldStar';
import { Body, Caption, Display, Title } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/state/AppState';
import type { Memory } from '@/types/models';
import type { ProfileChangeLog } from '@/types/profile';
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
  holiday: '✦',
};

type FeedItem =
  | { id: string; at: string; type: 'memory'; memory: Memory }
  | { id: string; at: string; type: 'change'; log: ProfileChangeLog }
  | { id: string; at: string; type: 'member'; nodeId: string };

export default function Home() {
  const router = useRouter();
  const { account, nodes, memories, getNode, fetchTreeChangeLog } = useAppState();
  const [changeLog, setChangeLog] = useState<ProfileChangeLog[]>([]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      fetchTreeChangeLog().then((rows) => alive && setChangeLog(rows));
      return () => {
        alive = false;
      };
    }, [fetchTreeChangeLog]),
  );

  const events = useMemo(() => getUpcomingEvents(nodes, { withinDays: 120 }).slice(0, 6), [nodes]);

  const feed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];
    for (const m of memories) items.push({ id: `m-${m.id}`, at: m.createdAt, type: 'memory', memory: m });
    for (const l of changeLog) items.push({ id: `c-${l.id}`, at: l.createdAt, type: 'change', log: l });
    // Recently added family members (last 45 days), excluding the self node.
    const cutoff = Date.now() - 45 * 24 * 60 * 60 * 1000;
    for (const n of nodes) {
      if (n.ownerAccountId === account?.id) continue;
      if (new Date(n.createdAt).getTime() >= cutoff) {
        items.push({ id: `n-${n.id}`, at: n.createdAt, type: 'member', nodeId: n.id });
      }
    }
    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 30);
  }, [memories, changeLog, nodes, account?.id]);

  const firstName = (account?.displayName ?? 'there').split(' ')[0];

  return (
    <ScreenContainer maxWidth={640}>
      <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
        <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.6 }}>Welcome back</Caption>
        <Display style={{ fontSize: 34 }}>Hello, {firstName}</Display>
        <Body style={{ fontSize: 17, color: colors.deepUmber }}>Here's what's happening across your family.</Body>
      </View>

      {/* Upcoming */}
      {events.length > 0 ? (
        <View style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
            <Title>Upcoming</Title>
            <Pressable onPress={() => router.push('/(tabs)/occasions')} hitSlop={8}>
              <Caption style={{ color: colors.guardianGold, fontWeight: '700' }}>See all ›</Caption>
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
                {e.subtitle ? <Caption numberOfLines={1}>{e.subtitle}</Caption> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* For You feed */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
        <Title>For you</Title>
        <GoldStar size={14} />
      </View>

      {feed.length === 0 ? (
        <Card>
          <View style={{ gap: spacing.sm }}>
            <Title>Your feed is just beginning</Title>
            <Body>
              As your family adds memories, updates profiles, and joins their nodes, you'll see it gather here.
            </Body>
            <Pressable onPress={() => router.push('/(tabs)/family-tree')} hitSlop={8}>
              <Caption style={{ color: colors.guardianGold, fontWeight: '700' }}>Open your Family Tree ›</Caption>
            </Pressable>
          </View>
        </Card>
      ) : (
        <View style={{ gap: spacing.md }}>
          {feed.map((item) => {
            if (item.type === 'memory') return <MemoryFeedCard key={item.id} memory={item.memory} getNode={getNode} onOpen={(id) => router.push({ pathname: '/node/[nodeId]', params: { nodeId: id } })} />;
            if (item.type === 'change') return <ChangeFeedCard key={item.id} log={item.log} getNode={getNode} onOpen={(id) => router.push({ pathname: '/node/[nodeId]', params: { nodeId: id } })} />;
            return <MemberFeedCard key={item.id} nodeId={item.nodeId} getNode={getNode} onOpen={(id) => router.push({ pathname: '/node/[nodeId]', params: { nodeId: id } })} />;
          })}
        </View>
      )}
    </ScreenContainer>
  );
}

function FeedShell({
  avatarName,
  memorial,
  uri,
  heading,
  time,
  children,
  onPress,
}: {
  avatarName: string;
  memorial?: boolean;
  uri?: string;
  heading: string;
  time: string;
  children?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Card onPress={onPress} accessibilityLabel={heading}>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Avatar name={avatarName} size={44} memorial={memorial} uri={uri} />
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
  onOpen: (id: string) => void;
}) {
  const node = memory.nodeId ? getNode(memory.nodeId) : undefined;
  return (
    <FeedShell
      avatarName={node?.displayName ?? 'A memory'}
      memorial={node?.isLiving === false}
      uri={node?.profile?.profilePhoto?.value ?? node?.avatarUrl}
      heading={node ? `New memory for ${node.displayName}` : 'A new memory'}
      time={timeAgo(memory.createdAt)}
      onPress={node ? () => onOpen(node.id) : undefined}
    >
      {memory.title ? <Body style={{ fontWeight: '600' }}>{memory.title}</Body> : null}
      {memory.body ? <Body numberOfLines={3} style={{ color: colors.deepUmber }}>{memory.body}</Body> : null}
      <Badge label={memory.type === 'text' ? 'Story' : memory.type[0].toUpperCase() + memory.type.slice(1)} tone="soft" />
    </FeedShell>
  );
}

const CHANGE_TEXT: Partial<Record<ProfileChangeLog['action'], string>> = {
  field_updated: 'updated the profile',
  field_visibility_changed: 'changed who can see a detail',
  tags_updated: 'updated family tags',
  suggested_edit_submitted: 'suggested a change',
  suggested_edit_approved: 'approved a suggested change',
};

function ChangeFeedCard({
  log,
  getNode,
  onOpen,
}: {
  log: ProfileChangeLog;
  getNode: (id: string) => ReturnType<typeof useAppState>['nodes'][number] | undefined;
  onOpen: (id: string) => void;
}) {
  const node = getNode(log.targetNodeId);
  const what = CHANGE_TEXT[log.action] ?? 'made an update';
  return (
    <FeedShell
      avatarName={node?.displayName ?? 'Family'}
      memorial={node?.isLiving === false}
      uri={node?.profile?.profilePhoto?.value ?? node?.avatarUrl}
      heading={node ? `${node.displayName}'s profile was updated` : 'A profile was updated'}
      time={timeAgo(log.createdAt)}
      onPress={node ? () => onOpen(node.id) : undefined}
    >
      <Body style={{ color: colors.deepUmber }}>Someone {what} in your Family Tree.</Body>
    </FeedShell>
  );
}

function MemberFeedCard({
  nodeId,
  getNode,
  onOpen,
}: {
  nodeId: string;
  getNode: (id: string) => ReturnType<typeof useAppState>['nodes'][number] | undefined;
  onOpen: (id: string) => void;
}) {
  const node = getNode(nodeId);
  if (!node) return null;
  return (
    <FeedShell
      avatarName={node.displayName}
      memorial={node.isLiving === false}
      uri={node.profile?.profilePhoto?.value ?? node.avatarUrl}
      heading={`${node.displayName} joined your Family Tree`}
      time={timeAgo(node.createdAt)}
      onPress={() => onOpen(node.id)}
    >
      <Body style={{ color: colors.deepUmber }}>A new light was added to your tree.</Body>
    </FeedShell>
  );
}
