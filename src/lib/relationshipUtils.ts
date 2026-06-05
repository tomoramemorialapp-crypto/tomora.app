import type { RelationshipType } from '@/types/models';

/** Generate a small unique id (good enough for mock/local state). */
export function createId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Human-friendly relationship label, phrased from the viewer's perspective.
 * e.g. "your grandparent", "your mother".
 */
export function relationshipLabel(type: RelationshipType): string {
  const map: Record<RelationshipType, string> = {
    self: 'you',
    parent: 'parent',
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
