import { useCallback, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { goBack } from '@/lib/navigation';
import { useAppState } from '@/state/AppState';
import type { Notification } from '@/types/models';

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

const ICON: Partial<Record<Notification['type'], string>> = {
  new_member: '🌱',
  invite: '✉️',
  request: '🤝',
  suggested_edit: '✏️',
  dispute: '⚖️',
  access: '🔑',
  memorial_pending: '🕯️',
  memorial_created: '🕯️',
  memorial_disputed: '⚖️',
  system: '✦',
};

export default function Notifications() {
  const router = useRouter();
  const {
    account,
    nodes,
    notifications,
    suggestedEdits,
    getNode,
    refreshNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAppState();

  useFocusEffect(
    useCallback(() => {
      refreshNotifications().catch(() => {});
    }, [refreshNotifications]),
  );

  // Suggested edits you can review (you steward those nodes).
  const reviewables = useMemo(
    () =>
      suggestedEdits.filter((e) => {
        if (e.status !== 'pending') return false;
        const node = getNode(e.targetNodeId);
        return node && (node.ownerAccountId === account?.id || node.managedByAccountId === account?.id);
      }),
    [suggestedEdits, getNode, account?.id],
  );

  // Family members added recently.
  const newMembers = useMemo(() => {
    const cutoff = Date.now() - 45 * 24 * 60 * 60 * 1000;
    return nodes
      .filter((n) => n.ownerAccountId !== account?.id && new Date(n.createdAt).getTime() >= cutoff)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12);
  }, [nodes, account?.id]);

  const hasAnything = notifications.length > 0 || reviewables.length > 0 || newMembers.length > 0;
  const hasUnread = notifications.some((n) => !n.isRead);

  const onOpenNotification = (n: Notification) => {
    if (!n.isRead) markNotificationRead(n.id).catch(() => {});
    if (n.nodeId) router.push({ pathname: '/node/[nodeId]', params: { nodeId: n.nodeId } });
  };

  return (
    <ScreenContainer maxWidth={640}>
      <Pressable onPress={() => goBack(router)} accessibilityRole="button" style={{ marginBottom: spacing.md }}>
        <Caption style={{ color: colors.deepUmber, fontSize: 15 }}>‹ Back</Caption>
      </Pressable>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.6 }}>Stay close</Caption>
          <Display style={{ fontSize: 32 }}>Notifications</Display>
        </View>
        {hasUnread ? (
          <Pressable onPress={() => markAllNotificationsRead().catch(() => {})} hitSlop={8}>
            <Caption style={{ color: colors.guardianGold, fontWeight: '700' }}>Mark all read</Caption>
          </Pressable>
        ) : null}
      </View>

      {!hasAnything ? (
        <EmptyState
          title="You're all caught up"
          body="New members, invites, requests, disputes, and memorial updates will appear here."
        />
      ) : null}

      {notifications.length > 0 ? (
        <View style={{ marginBottom: spacing.lg }}>
          <SectionHeader title="From your family" />
          <View style={{ gap: spacing.sm }}>
            {notifications.map((n) => {
              const node = n.nodeId ? getNode(n.nodeId) : undefined;
              return (
                <Pressable key={n.id} onPress={() => onOpenNotification(n)}>
                  <Card style={{ backgroundColor: n.isRead ? colors.paper : colors.candlelight }}>
                    <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
                      {node ? (
                        <Avatar name={node.displayName} size={40} memorial={node.isLiving === false} uri={node.profile?.profilePhoto?.value ?? node.avatarUrl} />
                      ) : (
                        <Body style={{ fontSize: 22 }}>{ICON[n.type] ?? '✦'}</Body>
                      )}
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
                          <Body style={{ flex: 1, fontWeight: '700' }}>{n.title}</Body>
                          <Caption>{timeAgo(n.createdAt)}</Caption>
                        </View>
                        {n.body ? <Body style={{ color: colors.deepUmber }}>{n.body}</Body> : null}
                      </View>
                      {!n.isRead ? (
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.guardianGold, marginTop: 6 }} />
                      ) : null}
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {reviewables.length > 0 ? (
        <View style={{ marginBottom: spacing.lg }}>
          <SectionHeader title="Suggested changes to review" />
          <View style={{ gap: spacing.sm }}>
            {reviewables.map((e) => {
              const node = getNode(e.targetNodeId);
              return (
                <Pressable
                  key={e.id}
                  onPress={() => router.push({ pathname: '/node/history', params: { nodeId: e.targetNodeId } })}
                >
                  <Card>
                    <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                      <Body style={{ fontSize: 22 }}>✏️</Body>
                      <View style={{ flex: 1 }}>
                        <Body style={{ fontWeight: '700' }}>
                          {node ? `A change was suggested for ${node.displayName}` : 'A change was suggested'}
                        </Body>
                        <Caption>Review and approve or decline ›</Caption>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {newMembers.length > 0 ? (
        <View style={{ marginBottom: spacing.lg }}>
          <SectionHeader title="New in your tree" />
          <View style={{ gap: spacing.sm }}>
            {newMembers.map((node) => (
              <Pressable
                key={node.id}
                onPress={() => router.push({ pathname: '/node/[nodeId]', params: { nodeId: node.id } })}
              >
                <Card>
                  <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                    <Avatar name={node.displayName} size={40} memorial={node.isLiving === false} uri={node.profile?.profilePhoto?.value ?? node.avatarUrl} />
                    <View style={{ flex: 1 }}>
                      <Body style={{ fontWeight: '700' }}>{node.displayName} joined your Family Tree</Body>
                      <Caption>{timeAgo(node.createdAt)}</Caption>
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </ScreenContainer>
  );
}
