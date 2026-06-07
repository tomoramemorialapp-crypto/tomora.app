import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { RelationshipPicker } from '@/components/onboarding/RelationshipPicker';
import { ContextRelationshipPicker } from '@/components/onboarding/ContextRelationshipPicker';
import { TextField } from '@/components/ui/TextField';
import { Toggle } from '@/components/ui/Toggle';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Body, Caption, Display, Title } from '@/components/ui/Typography';
import { DisconnectedNodeBridgePrompt } from '@/components/family-tree/DisconnectedNodeBridgePrompt';
import { ParentPairingPrompt } from '@/components/family-tree/ParentPairingPrompt';
import { SiblingBridgePrompt } from '@/components/family-tree/SiblingBridgePrompt';
import { colors, spacing } from '@/constants/theme';
import { relationshipChoices } from '@/constants/copy';
import { goBack } from '@/lib/navigation';
import { contextRelationshipChoices, previewInferredConnections } from '@/lib/contextualAdd';
import type { RelationshipChoice } from '@/lib/relationshipTaxonomy';
import { buildParentPartnershipEdge, type ParentPairingOpportunity } from '@/lib/parentPairing';
import {
  isSiblingRelationshipType,
  needsSiblingBridgePrompt,
  type SiblingBridgeMode,
} from '@/lib/siblingAdd';
import { findTreeAnchorId, treeMemberNodes } from '@/lib/activeNodes';
import { useAppState } from '@/state/AppState';
import type { RelationshipType } from '@/types/models';

type AnchorChoice = RelationshipChoice;
type ContextChoice = RelationshipChoice;

export default function NewRelative() {
  const router = useRouter();
  const { contextNodeId } = useLocalSearchParams<{ contextNodeId?: string }>();
  const { addRelative, createRelationship, nodes, relationships, account } = useAppState();
  const liveNodes = useMemo(
    () => treeMemberNodes(nodes, relationships, findTreeAnchorId(nodes)),
    [nodes, relationships],
  );

  const anchorNode = useMemo(
    () =>
      liveNodes.find((n) => n.ownerAccountId === account?.id) ??
      liveNodes.find((n) => n.status === 'claimed') ??
      liveNodes[0],
    [liveNodes, account?.id],
  );
  const contextNode = contextNodeId ? liveNodes.find((n) => n.id === contextNodeId) : undefined;
  const isContextual = !!contextNode && contextNode.id !== anchorNode?.id;

  const [anchorChoice, setAnchorChoice] = useState<AnchorChoice | undefined>(undefined);
  const [contextChoice, setContextChoice] = useState<ContextChoice | undefined>(undefined);
  const [name, setName] = useState('');
  const [isRemembered, setIsRemembered] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pairingOpportunity, setPairingOpportunity] = useState<ParentPairingOpportunity | null>(null);
  const [pairingBusy, setPairingBusy] = useState(false);
  const [showSiblingPrompt, setShowSiblingPrompt] = useState(false);
  const [siblingBridgeMode, setSiblingBridgeMode] = useState<SiblingBridgeMode | undefined>(undefined);
  const [siblingParentHint, setSiblingParentHint] = useState(false);

  const choice = isContextual ? contextChoice : anchorChoice;
  const relationshipType = choice?.relationshipType;
  const canSave = !!choice && name.trim().length > 0 && !busy;
  const isPet = relationshipType === 'pet';
  const isUnsure = relationshipType === 'other';
  const isSibling = relationshipType ? isSiblingRelationshipType(relationshipType) : false;
  const siblingChildId = isContextual ? contextNode?.id : anchorNode?.id;
  const needsSiblingBridge =
    isSibling && !!siblingChildId && needsSiblingBridgePrompt(siblingChildId, relationships);

  const inferredPreview = useMemo(() => {
    if (!isContextual || !contextNode || !relationshipType || !anchorNode) return [];
    return previewInferredConnections({
      contextNodeId: contextNode.id,
      relationshipToContext: relationshipType,
      anchorNodeId: anchorNode.id,
      nodes,
      relationships,
    });
  }, [isContextual, contextNode, relationshipType, anchorNode, nodes, relationships]);

  const saveRelative = async (bridgeMode?: SiblingBridgeMode) => {
    if (!choice || !relationshipType) return;
    setError(null);
    setBusy(true);
    try {
      const { pairingOpportunity } = await addRelative({
        name: name.trim(),
        relationshipType,
        relationshipDetail: choice.relationshipDetail,
        isRemembered,
        tags: isUnsure ? ['Unknown link'] : undefined,
        contextNodeId: isContextual ? contextNode!.id : undefined,
        siblingBridgeMode: bridgeMode,
      });

      if (pairingOpportunity) {
        setPairingOpportunity(pairingOpportunity);
        return;
      }
      goBack(router);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not add this family member. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const onSave = async () => {
    if (!choice || !relationshipType) return;
    if (needsSiblingBridge && !siblingBridgeMode) {
      setShowSiblingPrompt(true);
      return;
    }
    await saveRelative(siblingBridgeMode);
  };

  const onSiblingBridgeChoose = async (mode: SiblingBridgeMode) => {
    if (mode === 'add_parent_now') {
      setShowSiblingPrompt(false);
      setSiblingParentHint(true);
      return;
    }
    setSiblingBridgeMode(mode);
    setShowSiblingPrompt(false);
    await saveRelative(mode);
  };

  const onConfirmPairing = async (params: {
    choice: import('@/lib/parentPairing').ParentPartnershipChoice;
    lifecycle: import('@/lib/parentPairing').PartnershipLifecycle;
    husbandParentId?: string;
  }) => {
    if (!pairingOpportunity) return;
    if (params.choice === 'co_parent_only') {
      setPairingOpportunity(null);
      goBack(router);
      return;
    }

    setPairingBusy(true);
    try {
      const edge = buildParentPartnershipEdge({
        fromParentId: pairingOpportunity.parentAId,
        toParentId: pairingOpportunity.parentBId,
        choice: params.choice,
        lifecycle: params.lifecycle,
        husbandParentId: params.husbandParentId,
        nodes,
      });
      await createRelationship({
        fromNodeId: edge.fromNodeId,
        toNodeId: edge.toNodeId,
        relationshipType: edge.relationshipType,
        relationshipDetail: edge.relationshipDetail,
      });
      setPairingOpportunity(null);
      goBack(router);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not connect these parents. Please try again.');
    } finally {
      setPairingBusy(false);
    }
  };

  return (
    <>
    <SiblingBridgePrompt
      visible={showSiblingPrompt}
      busy={busy}
      onChoose={onSiblingBridgeChoose}
      onDismiss={() => setShowSiblingPrompt(false)}
    />
    <ParentPairingPrompt
      visible={!!pairingOpportunity}
      opportunity={pairingOpportunity}
      nodes={nodes}
      busy={pairingBusy}
      onConfirm={onConfirmPairing}
      onDismiss={() => {
        setPairingOpportunity(null);
        goBack(router);
      }}
    />
    <ScreenContainer
      maxWidth={620}
      footer={
        <View style={{ gap: spacing.sm }}>
          <Button label="Add to my Family Tree" variant="gold" disabled={!canSave} loading={busy} onPress={onSave} />
          <Button label="Cancel" variant="ghost" onPress={() => goBack(router)} />
        </View>
      }
    >
      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.6 }}>Grow your Family Tree</Caption>
          <Display style={{ fontSize: 32 }}>Add a family member</Display>
          {isContextual ? (
            <Body style={{ fontSize: 17 }}>
              Adding someone connected to {contextNode!.displayName}. Choose how they relate to{' '}
              {contextNode!.displayName.split(' ')[0]} — Tomora will wire up the rest of your tree.
            </Body>
          ) : (
            <Body style={{ fontSize: 17 }}>Who would you like to add?</Body>
          )}
        </View>

        {isContextual ? (
          <ContextRelationshipPicker
            selectedId={contextChoice?.id}
            onSelect={(next) => {
              setContextChoice(next);
              setSiblingBridgeMode(undefined);
              setSiblingParentHint(false);
              if (next.relationshipType === 'pet') setIsRemembered(false);
            }}
          />
        ) : (
          <RelationshipPicker
            selectedId={anchorChoice?.id}
            onSelect={(next) => {
              setAnchorChoice(next);
              setSiblingBridgeMode(undefined);
              setSiblingParentHint(false);
              if (next.relationshipType === 'pet') setIsRemembered(false);
            }}
          />
        )}

        {choice ? (
          <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
            <View style={{ gap: spacing.sm }}>
              <Title style={{ fontSize: 22 }}>What is their name?</Title>
              <TextField
                value={name}
                onChangeText={setName}
                placeholder={choice.label}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => canSave && onSave()}
              />
            </View>

            {isContextual && inferredPreview.length > 0 ? (
              <Card style={{ backgroundColor: colors.candlelight, borderColor: colors.softGold }}>
                <View style={{ gap: spacing.xs }}>
                  <Title style={{ fontSize: 18 }}>Tomora will also connect them</Title>
                  <Body style={{ fontSize: 15, color: colors.deepUmber }}>
                    Based on how {contextNode!.displayName} already fits in your tree:
                  </Body>
                  <View style={{ gap: 4, marginTop: spacing.xs }}>
                    {inferredPreview.map((line) => (
                      <Caption key={`${line.nodeId}-${line.relationshipType}`} style={{ fontSize: 14 }}>
                        · {line.label}
                      </Caption>
                    ))}
                  </View>
                </View>
              </Card>
            ) : null}

            {!isUnsure ? (
              <Card style={{ backgroundColor: colors.candlelight, borderColor: colors.softGold }}>
                <Toggle
                  value={isRemembered}
                  onValueChange={setIsRemembered}
                  label="In loving memory"
                  description={
                    isPet
                      ? 'Turn this on if your companion has passed away. Their node is kept by you and becomes a Memory Light.'
                      : 'Turn this on if they’ve passed away. Their node never needs to be claimed.'
                  }
                />
              </Card>
            ) : null}

            {siblingParentHint ? (
              <Card style={{ backgroundColor: colors.candlelight, borderColor: colors.softGold }}>
                <Body style={{ fontSize: 15 }}>
                  Add a mother or father first, then come back to add your sibling — Tomora will connect them to the
                  same parents automatically.
                </Body>
              </Card>
            ) : null}

            {!isContextual ? (
              <DisconnectedNodeBridgePrompt
                relationshipType={choice.relationshipType as RelationshipType}
                relationshipLabel={choice.label}
              />
            ) : null}
          </View>
        ) : null}

        {error ? <Caption style={{ color: colors.error, fontSize: 14 }}>{error}</Caption> : null}
      </View>
    </ScreenContainer>
    </>
  );
}
