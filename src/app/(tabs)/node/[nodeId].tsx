import { Pressable, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, NodeStatusBadge, VisibilityBadge } from '@/components/ui/Badge';
import { MemoryCard } from '@/components/memories/MemoryCard';
import { PassingControl } from '@/components/profile/PassingControl';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { copy } from '@/constants/copy';
import { useAppState } from '@/state/AppState';
import { relationshipPath } from '@/lib/relationshipUtils';
import { editScopeFor, formatDateValue, formatGenderSex, formatPlace } from '@/lib/profile';

export default function LifeProfile() {
  const router = useRouter();
  const { nodeId } = useLocalSearchParams<{ nodeId: string }>();
  const { getNode, getMemoriesForNode, getRelationshipForNode, getSuggestedEditsForNode, nodes, account } =
    useAppState();
  const { width } = useWindowDimensions();
  const stackActions = width < 480;

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

  const scope = editScopeFor(node, account?.id);
  const canEdit = scope === 'owner' || scope === 'guardian';
  const profile = node.profile ?? {};
  const pendingSuggestions = getSuggestedEditsForNode(node.id).filter((s) => s.status === 'pending').length;

  const details: { label: string; value: string }[] = [
    { label: 'Date of birth', value: formatDateValue(profile.dateOfBirth?.value) },
    { label: 'Date of death', value: formatDateValue(profile.dateOfDeath?.value) },
    { label: 'Place of birth', value: formatPlace(profile.placeOfBirth?.value) },
    { label: 'Place of death', value: formatPlace(profile.placeOfDeath?.value) },
    { label: 'Gender / Sex', value: formatGenderSex(profile.genderSex?.value) },
    { label: 'Languages', value: (profile.languages?.value ?? []).join(', ') },
    { label: 'Known for', value: (profile.notesHistory?.value?.knownFor ?? []).join(', ') },
    { label: 'What they did', value: (profile.notesHistory?.value?.occupationOrRole ?? []).join(', ') },
  ].filter((d) => d.value);

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
        <Avatar
          name={node.displayName}
          size={96}
          memorial={memorial}
          uri={profile.profilePhoto?.value ?? node.avatarUrl}
        />
        <Display style={{ fontSize: 30, textAlign: 'center' }}>{node.displayName}</Display>
        <Caption style={{ fontSize: 15, textAlign: 'center' }}>{path}</Caption>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xs }}>
          <NodeStatusBadge status={node.status} />
          <VisibilityBadge visibility={node.defaultVisibility} />
        </View>
        <View
          style={{
            flexDirection: stackActions ? 'column' : 'row',
            alignSelf: 'stretch',
            gap: spacing.sm,
            marginTop: spacing.sm,
          }}
        >
          <View style={{ flex: stackActions ? undefined : 1 }}>
            <Button
              label={canEdit ? 'Edit Profile' : 'Suggest a Change'}
              variant="secondary"
              onPress={() => router.push({ pathname: '/node/edit', params: { nodeId: node.id } })}
            />
          </View>
          <View style={{ flex: stackActions ? undefined : 1 }}>
            <Button
              label="Change History"
              variant="ghost"
              onPress={() => router.push({ pathname: '/node/history', params: { nodeId: node.id } })}
            />
          </View>
        </View>
        {canEdit && !isSelf && node.status !== 'claimed' ? (
          <View style={{ alignSelf: 'stretch', marginTop: spacing.sm }}>
            <Button
              label="Invite to claim"
              variant="gold"
              onPress={() => router.push({ pathname: '/node/invite', params: { nodeId: node.id } })}
            />
          </View>
        ) : null}
        {canEdit && pendingSuggestions > 0 ? (
          <Pressable
            onPress={() => router.push({ pathname: '/node/history', params: { nodeId: node.id } })}
            style={{
              marginTop: spacing.xs,
              backgroundColor: 'rgba(184,135,47,0.12)',
              borderRadius: radii.pill,
              paddingHorizontal: spacing.md,
              paddingVertical: 6,
            }}
          >
            <Caption style={{ color: colors.guardianGold, fontWeight: '700' }}>
              {pendingSuggestions} suggested {pendingSuggestions === 1 ? 'change' : 'changes'} to review ›
            </Caption>
          </Pressable>
        ) : null}
      </View>

      {/* Details */}
      {details.length > 0 ? (
        <Card style={{ marginBottom: spacing.lg }}>
          <SectionHeader title="Details" overline="Life Profile" />
          <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
            {details.map((d) => (
              <View key={d.label} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
                <Caption style={{ flex: 1 }}>{d.label}</Caption>
                <Body style={{ flex: 1.4, textAlign: 'right' }}>{d.value}</Body>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

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

      {/* Passing / Memorial */}
      <PassingControl node={node} canEdit={canEdit} />

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
              <MemoryCard
                key={m.id}
                memory={m}
                getNodeName={(id) => getNode(id)?.displayName}
                onOpen={() => router.push({ pathname: '/memory/[memoryId]', params: { memoryId: m.id } })}
              />
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
