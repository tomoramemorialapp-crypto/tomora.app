import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DateValueInput, dateValueToStorageIso, isoToDateValue } from '@/components/ui/DateValueInput';
import { Dropdown } from '@/components/ui/Dropdown';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Body, Caption } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { activeNodes } from '@/lib/activeNodes';
import {
  INVERSE_RELATIONSHIP_TYPE,
  connectionCaption,
  connectionLabel,
  detailOptionsForType,
  isValidDetailForType,
  perspectiveDetail,
  perspectiveType,
  relationshipTypeSupportsDetail,
  storedDetail,
  suggestDetailForType,
  suggestInLawType,
  type RelationshipDetail,
} from '@/lib/relationshipDetail';
import { ParentPairingPrompt } from '@/components/family-tree/ParentPairingPrompt';
import { buildParentPartnershipEdge, detectParentPairingOpportunity, type ParentPairingOpportunity } from '@/lib/parentPairing';
import { useAppState } from '@/state/AppState';
import type { FamilyNode, RelationshipType } from '@/types/models';
import type { DateValue } from '@/types/profile';

/** Relationship options, phrased as "[other] is this person's [label]". */
const OPTIONS: { id: RelationshipType; label: string }[] = [
  { id: 'parent', label: 'Biological parent' },
  { id: 'step_parent', label: 'Step-parent' },
  { id: 'parent_in_law', label: 'Parent-in-law' },
  { id: 'child', label: 'Child' },
  { id: 'child_in_law', label: 'Child-in-law (spouse of child)' },
  { id: 'sibling', label: 'Sibling' },
  { id: 'spouse', label: 'Spouse' },
  { id: 'partner', label: 'Partner' },
  { id: 'grandparent', label: 'Grandparent' },
  { id: 'grandchild', label: 'Grandchild' },
  { id: 'aunt_uncle', label: 'Aunt / Uncle' },
  { id: 'niece_nephew', label: 'Niece / Nephew' },
  { id: 'cousin', label: 'Cousin' },
  { id: 'friend', label: 'Friend' },
  { id: 'pet', label: 'Pet' },
  { id: 'caretaker', label: 'Caretaker' },
  { id: 'chosen_family', label: 'Chosen family' },
  { id: 'other', label: 'Not sure yet' },
];

/**
 * Edit how a node connects to the rest of the Family Tree: relink to specific
 * people (e.g. a sibling tied only to one parent), mark two parents as spouses,
 * or attach a niece to the right sibling. Edges are shown from this node's
 * perspective ("[other] is this person's …").
 */
function isPartnership(type: RelationshipType): boolean {
  return type === 'spouse' || type === 'partner';
}

export function ConnectionsEditor({ node }: { node: FamilyNode }) {
  const {
    account,
    nodes,
    relationships,
    getRelationshipsForNode,
    createRelationship,
    deleteRelationship,
    updateRelationship,
    updateRelationshipWeddingDate,
  } = useAppState();

  const isViewerSelf = node.ownerAccountId === account?.id;
  const possessive = isViewerSelf ? 'your' : `${node.displayName}'s`;

  const liveNodes = useMemo(() => activeNodes(nodes), [nodes]);
  const rels = getRelationshipsForNode(node.id);
  const nodeById = useMemo(() => new Map(liveNodes.map((n) => [n.id, n])), [liveNodes]);

  const [adding, setAdding] = useState(false);
  const [newTargetId, setNewTargetId] = useState<string | undefined>(undefined);
  const [newType, setNewType] = useState<RelationshipType>('parent');
  const [newDetail, setNewDetail] = useState<RelationshipDetail | undefined>(undefined);
  const [typeTouched, setTypeTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pairingOpportunity, setPairingOpportunity] = useState<ParentPairingOpportunity | null>(null);
  const [pairingBusy, setPairingBusy] = useState(false);

  const connectedIds = new Set(
    rels.map((r) => (r.fromNodeId === node.id ? r.toNodeId : r.fromNodeId)),
  );
  const candidates = liveNodes.filter((n) => n.id !== node.id && !connectedIds.has(n.id));

  const newTarget = newTargetId ? nodeById.get(newTargetId) : undefined;
  const inLawHint =
    newTargetId && suggestInLawType(node.id, newTargetId, relationships);

  useEffect(() => {
    if (!newTargetId || !newTarget) return;
    const suggested = suggestInLawType(node.id, newTargetId, relationships);
    const type = suggested && !typeTouched ? suggested : newType;
    if (suggested && !typeTouched) setNewType(suggested);
    setNewDetail(suggestDetailForType(type, newTarget));
  }, [newTargetId, newTarget, newType, relationships, node.id, typeTouched]);

  const onChangeType = async (
    relId: string,
    isSource: boolean,
    next: RelationshipType,
    other?: FamilyNode,
    currentDetail?: RelationshipDetail,
  ) => {
    setBusy(true);
    try {
      const storedType = isSource ? next : INVERSE_RELATIONSHIP_TYPE[next];
      let detail = currentDetail;
      if (detail && !isValidDetailForType(next, detail)) {
        detail = other ? suggestDetailForType(next, other) : undefined;
      }
      await updateRelationship(relId, {
        relationshipType: storedType,
        relationshipDetail: storedDetail(isSource, detail) ?? null,
      });
    } finally {
      setBusy(false);
    }
  };

  const onChangeDetail = async (
    relId: string,
    isSource: boolean,
    type: RelationshipType,
    detail: RelationshipDetail | undefined,
  ) => {
    setBusy(true);
    try {
      await updateRelationship(relId, {
        relationshipDetail: storedDetail(isSource, detail) ?? null,
      });
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async (relId: string) => {
    setBusy(true);
    try {
      await deleteRelationship(relId);
    } finally {
      setBusy(false);
    }
  };

  const onChangeWeddingDate = async (relId: string, value: DateValue | undefined) => {
    const iso = dateValueToStorageIso(value);
    // Partial input (month/day without year) emits a DateValue that does not serialize — do not wipe a saved date.
    if (iso === null && value !== undefined) return;
    setBusy(true);
    try {
      await updateRelationshipWeddingDate(relId, iso);
    } finally {
      setBusy(false);
    }
  };

  const onAdd = async () => {
    if (!newTargetId) {
      setError('Choose who to connect to first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createRelationship({
        fromNodeId: node.id,
        toNodeId: newTargetId,
        relationshipType: newType,
        relationshipDetail: storedDetail(true, newDetail),
      });

      const opportunity =
        newType === 'parent' || newType === 'step_parent'
          ? detectParentPairingOpportunity({
              childId: node.id,
              nodes,
              relationships: [
                ...relationships,
                {
                  id: '__pending__',
                  familyTreeId: node.familyTreeId,
                  fromNodeId: node.id,
                  toNodeId: newTargetId,
                  relationshipType: newType,
                  relationshipDetail: storedDetail(true, newDetail),
                  status: 'approved',
                  visibility: 'family_tree',
                  createdByAccountId: '',
                  createdAt: '',
                  updatedAt: '',
                },
              ],
            })
          : null;

      setAdding(false);
      setNewTargetId(undefined);
      setNewType('parent');
      setNewDetail(undefined);

      if (opportunity) {
        setPairingOpportunity(opportunity);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add this connection. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const onConfirmPairing = async (params: {
    choice: import('@/lib/parentPairing').ParentPartnershipChoice;
    lifecycle: import('@/lib/parentPairing').PartnershipLifecycle;
    husbandParentId?: string;
  }) => {
    if (!pairingOpportunity) return;
    if (params.choice === 'co_parent_only') {
      setPairingOpportunity(null);
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not connect these parents. Please try again.');
    } finally {
      setPairingBusy(false);
    }
  };

  return (
    <>
    <ParentPairingPrompt
      visible={!!pairingOpportunity}
      opportunity={pairingOpportunity}
      nodes={liveNodes}
      busy={pairingBusy}
      onConfirm={onConfirmPairing}
      onDismiss={() => setPairingOpportunity(null)}
    />
    <Card style={{ marginBottom: spacing.lg }}>
      <SectionHeader title="Connections" />
      <Caption style={{ marginTop: spacing.xs }}>
        {isViewerSelf
          ? 'Choose exactly who you connect to in your Family Tree — for example, a sibling tied only to one parent, a father-in-law, or two parents shown as spouses.'
          : `Choose exactly who ${node.displayName} connects to — for example, a sibling tied only to one parent, a father-in-law, or two parents shown as spouses.`}
      </Caption>

      <View style={{ gap: spacing.md, marginTop: spacing.md }}>
        {rels.length === 0 ? (
          <Caption>No connections yet.</Caption>
        ) : (
          rels.map((rel) => {
            const otherId = rel.fromNodeId === node.id ? rel.toNodeId : rel.fromNodeId;
            const other = nodeById.get(otherId);
            const isSource = rel.fromNodeId === node.id;
            const pType = perspectiveType(rel, node.id);
            const pDetail = perspectiveDetail(rel, node.id);
            const inLawSuggestion = other ? suggestInLawType(node.id, other.id, relationships) : null;

            return (
              <View
                key={rel.id}
                style={{ borderWidth: 1, borderColor: colors.mistBeige, borderRadius: radii.md, padding: spacing.sm }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Body style={{ fontWeight: '600' }}>{other?.displayName ?? 'Unknown'}</Body>
                  <Pressable onPress={() => onRemove(rel.id)} hitSlop={8} disabled={busy}>
                    <Caption style={{ color: colors.error }}>Remove</Caption>
                  </Pressable>
                </View>
                <Caption style={{ marginTop: 2, marginBottom: 6 }}>
                  {other?.displayName}{' '}
                  {isViewerSelf
                    ? `is your ${connectionLabel(pType, pDetail)}`
                    : connectionCaption(node.displayName, pType, pDetail)}
                </Caption>
                {inLawSuggestion && inLawSuggestion !== pType ? (
                  <Caption style={{ color: colors.guardianGold, marginBottom: 6 }}>
                    This connection may be a{' '}
                    {inLawSuggestion === 'parent_in_law' ? 'parent-in-law' : 'child-in-law'} — consider updating the
                    relationship type below.
                  </Caption>
                ) : null}
                <Dropdown
                  label={`Relationship — they are ${possessive}…`}
                  value={pType}
                  onChange={(v) => onChangeType(rel.id, isSource, v as RelationshipType, other, pDetail)}
                  options={OPTIONS.map((o) => ({ value: o.id, label: o.label }))}
                  placeholder="Choose a relationship"
                />
                {relationshipTypeSupportsDetail(pType) ? (
                  <View style={{ marginTop: spacing.sm }}>
                    <Dropdown
                      label="Specific term"
                      value={pDetail ?? ''}
                      onChange={(v) =>
                        onChangeDetail(rel.id, isSource, pType, (v || undefined) as RelationshipDetail | undefined)
                      }
                      options={detailOptionsForType(pType).map((o) => ({ value: o.id, label: o.label }))}
                      placeholder="Choose father, mother, son, daughter…"
                    />
                  </View>
                ) : null}
                {isPartnership(pType) ? (
                  <View style={{ marginTop: spacing.sm }}>
                    <DateValueInput
                      key={`wedding-${rel.id}-${rel.weddingDate ?? 'empty'}`}
                      label="Wedding date"
                      value={isoToDateValue(rel.weddingDate)}
                      onChange={(d) => onChangeWeddingDate(rel.id, d)}
                    />
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </View>

      <View style={{ marginTop: spacing.md }}>
        {adding ? (
          <View style={{ gap: spacing.md }}>
            {candidates.length === 0 ? (
              <Caption>
                {isViewerSelf ? 'Everyone is already connected to you.' : `Everyone is already connected to ${node.displayName}.`}
              </Caption>
            ) : (
              <Dropdown
                label="Connect to"
                value={newTargetId ?? ''}
                onChange={(v) => {
                  setNewTargetId(v || undefined);
                  setTypeTouched(false);
                  setError(null);
                }}
                options={candidates.map((c) => ({ value: c.id, label: c.displayName }))}
                placeholder="Choose a person"
                searchable
              />
            )}
            {inLawHint ? (
              <Caption style={{ color: colors.guardianGold }}>
                Based on your spouse connections, this looks like a{' '}
                {inLawHint === 'parent_in_law' ? 'parent-in-law' : 'child-in-law'} relationship.
              </Caption>
            ) : null}
            <Dropdown
              label={`Relationship — they are ${possessive}…`}
              value={newType}
              onChange={(v) => {
                const t = v as RelationshipType;
                setTypeTouched(true);
                setNewType(t);
                if (newTarget) {
                  setNewDetail(suggestDetailForType(t, newTarget));
                }
              }}
              options={OPTIONS.map((o) => ({ value: o.id, label: o.label }))}
              placeholder="Choose a relationship"
            />
            {relationshipTypeSupportsDetail(newType) && newTarget ? (
              <Dropdown
                label="Specific term"
                value={newDetail ?? ''}
                onChange={(v) => {
                  setTypeTouched(true);
                  setNewDetail((v || undefined) as RelationshipDetail | undefined);
                }}
                options={detailOptionsForType(newType).map((o) => ({ value: o.id, label: o.label }))}
                placeholder="Choose father, mother, son-in-law…"
              />
            ) : null}
            {newTarget ? (
              <Caption style={{ color: colors.deepUmber }}>
                {newTarget.displayName}{' '}
                {isViewerSelf
                  ? `is your ${connectionLabel(newType, newDetail)}`
                  : connectionCaption(node.displayName, newType, newDetail)}
              </Caption>
            ) : null}
            {error ? <Caption style={{ color: colors.error }}>{error}</Caption> : null}
            <View style={{ gap: spacing.sm }}>
              <Button
                label={busy ? 'Adding…' : 'Add connection'}
                variant="gold"
                disabled={busy || !newTargetId || candidates.length === 0}
                onPress={onAdd}
              />
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => {
                  setAdding(false);
                  setError(null);
                }}
              />
            </View>
          </View>
        ) : candidates.length > 0 ? (
          <Button
            label="Add a connection"
            variant="secondary"
            onPress={() => {
              setAdding(true);
              setTypeTouched(false);
              setNewType('parent');
              setNewDetail(undefined);
            }}
          />
        ) : null}
      </View>
    </Card>
    </>
  );
}
