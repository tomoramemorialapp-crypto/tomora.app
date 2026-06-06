import type { NodeStatus, Relationship, RelationshipType } from '@/types/models';

/** Generate a small unique id (good enough for mock/local state). */
export function createId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Generation of a related node relative to the viewer ("you").
 *  -1 = an older generation (shown ABOVE you)
 *   0 = the same generation (shown BESIDE you, to the right)
 *  +1 = a younger generation (shown BELOW you)
 */
export function generationOffset(type: RelationshipType): -1 | 0 | 1 {
  switch (type) {
    case 'parent':
    case 'step_parent':
    case 'parent_in_law':
    case 'grandparent':
    case 'aunt_uncle':
      return -1;
    case 'child':
    case 'grandchild':
    case 'niece_nephew':
    case 'pet':
      return 1;
    default:
      // self, sibling, spouse, partner, cousin, friend, caretaker, chosen_family, other
      return 0;
  }
}

/** Whether a node needs a real person to claim it. Pets and the remembered do not. */
export function needsClaim(type: RelationshipType, isRemembered: boolean): boolean {
  return !(isRemembered || type === 'pet');
}

/** Resolve the initial node status for a newly added relative. */
export function nodeStatusFor(type: RelationshipType, isRemembered: boolean): NodeStatus {
  if (isRemembered) return 'memory_light';
  if (type === 'pet') return 'managed';
  return 'placeholder';
}

/** Pets are living unless explicitly remembered; the remembered have passed. */
export function isLivingFor(_type: RelationshipType, isRemembered: boolean): boolean {
  return !isRemembered;
}

/**
 * Human-friendly relationship label, phrased from the viewer's perspective.
 * e.g. "your grandparent", "your mother".
 */
export function relationshipLabel(type: RelationshipType): string {
  const map: Record<RelationshipType, string> = {
    self: 'you',
    parent: 'parent',
    step_parent: 'step-parent',
    parent_in_law: 'parent-in-law',
    child: 'child',
    sibling: 'sibling',
    grandparent: 'grandparent',
    grandchild: 'grandchild',
    aunt_uncle: 'aunt or uncle',
    niece_nephew: 'niece or nephew',
    cousin: 'cousin',
    spouse: 'spouse',
    partner: 'partner',
    friend: 'friend',
    pet: 'companion',
    caretaker: 'caretaker',
    chosen_family: 'chosen family',
    other: 'loved one',
  };
  return map[type] ?? 'loved one';
}

/** Build a short relationship path string for a Life Profile header. */
export function relationshipPath(type: RelationshipType): string {
  if (type === 'self') return 'This is you';
  if (type === 'pet') return 'Your companion';
  if (type === 'other') return 'Someone remembered';
  return `Your ${relationshipLabel(type)}`;
}

const RELATIONSHIP_PRIORITY: RelationshipType[] = [
  'parent',
  'step_parent',
  'parent_in_law',
  'child',
  'spouse',
  'partner',
  'sibling',
  'grandparent',
  'grandchild',
  'aunt_uncle',
  'niece_nephew',
  'cousin',
  'caretaker',
  'pet',
  'friend',
  'chosen_family',
  'other',
];

/**
 * Pick the best relationship edge for a node from the viewer's perspective.
 * Prefers the edge that touches the viewer's own node, then the most specific type.
 */
export function pickPrimaryRelationship(
  relationships: Relationship[],
  nodeId: string,
  selfNodeId?: string,
): Relationship | undefined {
  const rels = relationships.filter((r) => r.fromNodeId === nodeId || r.toNodeId === nodeId);
  if (!rels.length) return undefined;

  if (selfNodeId) {
    const viaSelf = rels.filter((r) => r.fromNodeId === selfNodeId || r.toNodeId === selfNodeId);
    if (viaSelf.length === 1) return viaSelf[0];
    if (viaSelf.length > 1) {
      return [...viaSelf].sort(
        (a, b) => RELATIONSHIP_PRIORITY.indexOf(a.relationshipType) - RELATIONSHIP_PRIORITY.indexOf(b.relationshipType),
      )[0];
    }
  }

  return [...rels].sort(
    (a, b) => RELATIONSHIP_PRIORITY.indexOf(a.relationshipType) - RELATIONSHIP_PRIORITY.indexOf(b.relationshipType),
  )[0];
}
