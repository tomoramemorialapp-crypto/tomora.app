import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DateValueInput, dateValueToStorageIso, isoToDateValue } from '@/components/ui/DateValueInput';
import { Dropdown } from '@/components/ui/Dropdown';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Body, Caption } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/state/AppState';
import type { FamilyNode, RelationshipType } from '@/types/models';
import type { DateValue } from '@/types/profile';

/** Relationship options, phrased as "[other] is this person's [label]". */
const OPTIONS: { id: RelationshipType; label: string }[] = [
  { id: 'parent', label: 'Parent' },
  { id: 'child', label: 'Child' },
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

/** The reverse of a relationship, used to flip perspective on stored edges. */
const INVERSE: Record<RelationshipType, RelationshipType> = {
  self: 'self',
  parent: 'child',
  child: 'parent',
  sibling: 'sibling',
  grandparent: 'grandchild',
  grandchild: 'grandparent',
  aunt_uncle: 'niece_nephew',
  niece_nephew: 'aunt_uncle',
  cousin: 'cousin',
  spouse: 'spouse',
  partner: 'partner',
  friend: 'friend',
  pet: 'caretaker',
  caretaker: 'pet',
  chosen_family: 'chosen_family',
  other: 'other',
};

function labelFor(type: RelationshipType): string {
  return OPTIONS.find((o) => o.id === type)?.label ?? 'Connection';
}

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
    nodes,
    getRelationshipsForNode,
    createRelationship,
    deleteRelationship,
    updateRelationshipType,
    updateRelationshipWeddingDate,
  } = useAppState();

  const rels = getRelationshipsForNode(node.id);
  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const [adding, setAdding] = useState(false);
  const [newTargetId, setNewTargetId] = useState<string | undefined>(undefined);
  const [newType, setNewType] = useState<RelationshipType>('parent');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nodes available to connect to (exclude self + already-connected).
  const connectedIds = new Set(
    rels.map((r) => (r.fromNodeId === node.id ? r.toNodeId : r.fromNodeId)),
  );
  const candidates = nodes.filter((n) => n.id !== node.id && !connectedIds.has(n.id));

  // Perspective type for an edge: direct when this node is the source, else inverse.
  const perspectiveType = (rel: (typeof rels)[number]): RelationshipType =>
    rel.fromNodeId === node.id ? rel.relationshipType : INVERSE[rel.relationshipType];

  const onChangeType = async (relId: string, isSource: boolean, next: RelationshipType) => {
    setBusy(true);
    try {
      await updateRelationshipType(relId, isSource ? next : INVERSE[next]);
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
    setBusy(true);
    try {
      await updateRelationshipWeddingDate(relId, dateValueToStorageIso(value));
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
      await createRelationship({ fromNodeId: node.id, toNodeId: newTargetId, relationshipType: newType });
      // Only dismiss the form once the connection actually persisted.
      setAdding(false);
      setNewTargetId(undefined);
      setNewType('parent');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add this connection. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={{ marginBottom: spacing.lg }}>
      <SectionHeader title="Connections" />
      <Caption style={{ marginTop: spacing.xs }}>
        Choose exactly who {node.displayName} connects to — for example, a sibling tied only to one parent, or two
        parents shown as spouses.
      </Caption>

      <View style={{ gap: spacing.md, marginTop: spacing.md }}>
        {rels.length === 0 ? (
          <Caption>No connections yet.</Caption>
        ) : (
          rels.map((rel) => {
            const otherId = rel.fromNodeId === node.id ? rel.toNodeId : rel.fromNodeId;
            const other = nodeById.get(otherId);
            const isSource = rel.fromNodeId === node.id;
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
                  is {node.displayName}’s {labelFor(perspectiveType(rel)).toLowerCase()}
                </Caption>
                <TypeChips value={perspectiveType(rel)} onChange={(t) => onChangeType(rel.id, isSource, t)} />
                {isPartnership(perspectiveType(rel)) ? (
                  <View style={{ marginTop: spacing.sm }}>
                    <DateValueInput
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
              <Caption>Everyone is already connected to {node.displayName}.</Caption>
            ) : (
              <Dropdown
                label="Connect to"
                value={newTargetId ?? ''}
                onChange={(v) => {
                  setNewTargetId(v || undefined);
                  setError(null);
                }}
                options={candidates.map((c) => ({ value: c.id, label: c.displayName }))}
                placeholder="Choose a person"
                searchable
              />
            )}
            <Dropdown
              label={`Relationship — they are ${node.displayName}’s…`}
              value={newType}
              onChange={(v) => setNewType(v as RelationshipType)}
              options={OPTIONS.map((o) => ({ value: o.id, label: o.label }))}
              placeholder="Choose a relationship"
            />
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
          <Button label="Add a connection" variant="secondary" onPress={() => setAdding(true)} />
        ) : null}
      </View>
    </Card>
  );
}

function TypeChips({ value, onChange }: { value: RelationshipType; onChange: (t: RelationshipType) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {OPTIONS.map((o) => (
        <Chip key={o.id} label={o.label} active={o.id === value} onPress={() => onChange(o.id)} />
      ))}
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: active ? 'rgba(184,135,47,0.14)' : colors.white,
        borderColor: active ? colors.guardianGold : colors.mistBeige,
        borderWidth: 1.5,
        borderRadius: radii.pill,
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}
    >
      <Body style={{ fontSize: 13, color: active ? colors.guardianGold : colors.charcoal }}>{label}</Body>
    </Pressable>
  );
}
