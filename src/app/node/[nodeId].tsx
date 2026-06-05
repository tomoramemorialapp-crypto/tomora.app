import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, NodeStatusBadge, VisibilityBadge } from '@/components/ui/Badge';
import { MemoryCard } from '@/components/memories/MemoryCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { colors, spacing } from '@/constants/theme';
import { copy } from '@/constants/copy';
import { useAppState } from '@/state/AppState';
import { relationshipPath } from '@/lib/relationshipUtils';

export default function LifeProfile() {
  const router = useRouter();
  const { nodeId } = useLocalSearchParams<{ nodeId: string }>();
  const { getNode, getMemoriesForNode, getRelationshipForNode, nodes } = useAppState();

  const node = getNode(String(nodeId));
  if (!node) {
    return (
      <ScreenContainer center>
        <EmptyState title="This light isn’t here." body="It may have been removed from your Family Tree." />
        <Button label="Back to Family Tree" variant="secondary" onPress={() => router.replace('/(tabs)/family-tree')} />
      </ScreenContainer>
    );
  }

  const memorial = node.status === 'memory_light' || node.isLiving === false;
  const memories = getMemoriesForNode(node.id);
  const rel = getRelationshipForNode(node.id);
  const other = rel ? nodes.find((n) => n.id !== node.id && (n.id === rel.fromNodeId || n.id === rel.toNodeId)) : undefined;
  const isSelf = !!node.ownerAccountId;
  const path = isSelf ? 'This is you' : rel ? relationshipPath(rel.relationshipType) : 'In your Family Tree';

  return (
    <ScreenContainer
      maxWidth={620}
      footer={
        <Button
          label="Add a memory"
          variant="gold"
          onPress={() => router.push({ pathname: '/memory/new', params: { nodeId: node.id } })}
        />
      }
    >
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={{ marginBottom: spacing.md }}
      >
        <Caption style={{ color: colors.deepUmber, fontSize: 15 }}>‹ Back</Caption>
      </Pressable>

      <View style={{ alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
        <Avatar name={node.displayName} size={96} memorial={memorial} />
        <Display style={{ fontSize: 30 }}>{node.displayName}</Display>
        <Caption style={{ fontSize: 15 }}>{path}</Caption>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
          <NodeStatusBadge status={node.status} />
          <VisibilityBadge visibility={node.defaultVisibility} />
        </View>
      </View>

      {/* Overview */}
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Overview" overline="Life Profile" />
        <Body>
          {memorial
            ? 'A Memory Light kept gently by the family. Add a tribute, a story, or a photo to keep this light close.'
            : isSelf
              ? 'This is your place in the Family Tree. You choose what to share and what to keep private.'
              : `${node.displayName} has a place in your Family Tree. Invite them to claim their node when you’re ready.`}
        </Body>
      </Card>

      {/* Relationships */}
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Relationships" />
        {rel && other ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Body>{`Connected to ${other.displayName}`}</Body>
            <Badge label="Approved" tone="soft" />
          </View>
        ) : (
          <Body style={{ color: colors.ashTaupe }}>No approved relationships yet.</Body>
        )}
      </Card>

      {/* Memories */}
      <View style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Memories" />
        {memories.length === 0 ? (
          <EmptyState title={copy.emptyMemories.title} body={copy.emptyMemories.body} />
        ) : (
          <View style={{ gap: spacing.md }}>
            {memories.map((m) => (
              <MemoryCard key={m.id} memory={m} />
            ))}
          </View>
        )}
      </View>

      {/* Privacy */}
      <Card>
        <SectionHeader title="Privacy" />
        <Body>{copy.privateContent}</Body>
        <Caption style={{ marginTop: spacing.sm }}>
          Seeing a profile never means seeing every memory. Each memory keeps its own visibility.
        </Caption>
      </Card>
    </ScreenContainer>
  );
}
