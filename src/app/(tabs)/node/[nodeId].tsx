import { useState } from 'react';
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
import { goBack } from '@/lib/navigation';
import { relationshipPath } from '@/lib/relationshipUtils';
import { formatPreviousNamesList } from '@/lib/previousNames';
import { NodeTransferModal } from '@/components/profile/NodeTransferModal';
import { editScopeFor, formatDateValue, formatGenderSex, formatPlace, resolvePersonName } from '@/lib/profile';

export default function LifeProfile() {
  const router = useRouter();
  const { nodeId } = useLocalSearchParams<{ nodeId: string }>();
  const {
    getNode,
    getMemoriesForNode,
    getRelationshipForNode,
    getRelationshipsForNode,
    getSuggestedEditsForNode,
    nodes,
    account,
    requestNodeTransfer,
  } = useAppState();
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferBusy, setTransferBusy] = useState(false);
  const [transferNote, setTransferNote] = useState<string | null>(null);
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

  const memorial =
    node.status === 'memory_light' || node.status === 'memorial_pending' || node.isLiving === false;
  // A pet is owned by its creator and linked caretakers — it never has an
  // account to claim, so the claim flow doesn't apply.
  const isPetNode = getRelationshipsForNode(node.id).some((r) => r.relationshipType === 'pet');
  const memories = getMemoriesForNode(node.id);
  const rel = getRelationshipForNode(node.id);
  const other = rel ? nodes.find((n) => n.id !== node.id && (n.id === rel.fromNodeId || n.id === rel.toNodeId)) : undefined;
  const isSelf = node.ownerAccountId === account?.id;
  const path = isSelf ? 'This is you' : rel ? relationshipPath(rel.relationshipType) : 'In your Family Tree';

  const scope = editScopeFor(node, account?.id);
  const canEdit = scope === 'owner' || scope === 'guardian';
  const canInvite = canEdit && !isSelf && !isPetNode && !memorial && node.status !== 'claimed';
  const profile = node.profile ?? {};
  const pendingSuggestions = getSuggestedEditsForNode(node.id).filter((s) => s.status === 'pending').length;

  const nameParts = resolvePersonName(profile, node.displayName);
  const details: { label: string; value: string }[] = [
    ...(nameParts.firstName ? [{ label: 'First name', value: nameParts.firstName }] : []),
    ...(nameParts.middleName ? [{ label: 'Middle name', value: nameParts.middleName }] : []),
    ...(nameParts.surname ? [{ label: 'Surname', value: nameParts.surname }] : []),
    ...(nameParts.suffix ? [{ label: 'Suffix', value: nameParts.suffix }] : []),
    ...(profile.alternateNames?.value?.length
      ? [{ label: 'Also known as', value: profile.alternateNames.value.join(', ') }]
      : []),
    ...(profile.previousNames?.value?.length
      ? [{ label: 'Previous names', value: formatPreviousNamesList(profile.previousNames.value) }]
      : []),
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
        <View style={{ gap: spacing.sm }}>
          {memorial ? (
            <Button
              label="Open Memorial Page"
              variant="gold"
              onPress={() => router.push({ pathname: '/memorial/[nodeId]', params: { nodeId: node.id } })}
            />
          ) : null}
          <Button
            label="Add a memory"
            variant={memorial ? 'secondary' : 'gold'}
            onPress={() => router.push({ pathname: '/memory/new', params: { nodeId: node.id } })}
          />
        </View>
      }
    >
      <Pressable
        onPress={() => goBack(router)}
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
        {canEdit && !isSelf && !isPetNode && memorial ? (
          <View style={{ alignSelf: 'stretch', marginTop: spacing.sm }}>
            <Button label="Invite to claim" variant="secondary" disabled />
            <Caption align="center" style={{ marginTop: spacing.xs, color: colors.ashTaupe }}>
              Invites are not available for someone who has passed.
            </Caption>
          </View>
        ) : null}
        {canInvite ? (
          <View style={{ alignSelf: 'stretch', marginTop: spacing.sm }}>
            <Button
              label="Invite to claim"
              variant="gold"
              onPress={() => router.push({ pathname: '/node/invite', params: { nodeId: node.id } })}
            />
          </View>
        ) : null}
        {isSelf ? (
          <View style={{ alignSelf: 'stretch', marginTop: spacing.sm }}>
            <Button label={copy.transfer.rowLabel} variant="ghost" onPress={() => setTransferOpen(true)} />
            {transferNote ? (
              <Caption align="center" style={{ marginTop: spacing.xs, color: colors.deepUmber }}>
                {transferNote}
              </Caption>
            ) : (
              <Caption align="center" style={{ marginTop: spacing.xs, color: colors.ashTaupe }}>
                {copy.transfer.rowHint}
              </Caption>
            )}
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
              : isPetNode
                ? `${node.displayName} is a cherished companion in your Family Tree, cared for by you and any caretakers you add.`
                : `${node.displayName} has a place in your Family Tree. Invite them to claim their node when you’re ready.`}
        </Body>
      </Card>

      {/* Passing workflow — only while the person is still living */}
      {!memorial ? <PassingControl node={node} canEdit={canEdit} /> : null}

      {memorial ? (
        <Card style={{ marginBottom: spacing.lg, backgroundColor: colors.candlelight, borderColor: colors.softGold }}>
          <SectionHeader title="Memorial" />
          <Body style={{ marginTop: spacing.sm }}>
            Their tribute page, guestbook, and remembrance memories live on a separate Memorial Page.
          </Body>
          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            <Button
              label="View Memorial Page"
              variant="gold"
              onPress={() => router.push({ pathname: '/memorial/[nodeId]', params: { nodeId: node.id } })}
            />
            {canEdit ? (
              <Button
                label="Edit Memorial Page"
                variant="secondary"
                onPress={() => router.push({ pathname: '/memorial/edit', params: { nodeId: node.id } })}
              />
            ) : null}
          </View>
        </Card>
      ) : null}

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

      <NodeTransferModal
        visible={transferOpen}
        nodeName={node.displayName}
        busy={transferBusy}
        onClose={() => setTransferOpen(false)}
        onSubmit={async (email) => {
          setTransferBusy(true);
          setTransferNote(null);
          try {
            const req = await requestNodeTransfer(node.id, email);
            setTransferNote(`Transfer sent to ${email}. They have until ${new Date(req.expiresAt).toLocaleDateString()} to accept.`);
          } finally {
            setTransferBusy(false);
          }
        }}
      />
    </ScreenContainer>
  );
}
