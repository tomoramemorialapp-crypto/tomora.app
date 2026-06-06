import type { RelationshipType } from '@/types/models';
import type { KinshipNode } from './types';

/** True for synthetic TKE bridge nodes (not persisted in the app database). */
export function isSyntheticPlaceholder(node: Pick<KinshipNode, 'id' | 'nodeType'>): boolean {
  return node.nodeType === 'placeholder' || node.id.startsWith('ph:');
}

/**
 * Infer the anchor-centric relationship type to use when turning a synthetic
 * unknown node into a real Life Profile.
 */
export function relationshipTypeForPlaceholder(node: KinshipNode): RelationshipType {
  const role = (node.metadata?.roleLabel as string | undefined) ?? '';
  const byRole: Record<string, RelationshipType> = {
    Father: 'parent',
    Mother: 'parent',
    Parent: 'parent',
    Grandparent: 'grandparent',
    'Aunt or Uncle': 'aunt_uncle',
    Cousin: 'cousin',
    Sibling: 'sibling',
    Partner: 'partner',
    Child: 'child',
    Grandchild: 'grandchild',
    'Niece or Nephew': 'niece_nephew',
    Pet: 'pet',
  };
  if (byRole[role]) return byRole[role];

  const gen = node.generationOffset ?? 0;
  if (gen <= -2) return 'grandparent';
  if (gen === -1) return 'parent';
  if (gen >= 2) return 'grandchild';
  if (gen === 1) return role === 'Niece or Nephew' ? 'niece_nephew' : 'child';

  if (node.id.includes(':auntuncle:')) return 'aunt_uncle';
  if (node.id.includes(':sibling:')) return 'sibling';
  if (node.id.includes(':child:')) return 'child';
  if (node.id.includes(':parent:')) return 'parent';

  return 'other';
}

/** Sensible default display name for a newly materialized unknown node. */
export function defaultNameForPlaceholder(node: KinshipNode): string {
  const trimmed = node.displayName?.trim();
  if (trimmed && !/^unknown/i.test(trimmed)) return trimmed;

  const role = (node.metadata?.roleLabel as string | undefined) ?? '';
  if (role === 'Aunt or Uncle') return 'Unknown aunt or uncle';
  if (role) return `Unknown ${role.toLowerCase()}`;

  const label = node.relationshipLabelFromAnchor?.trim();
  if (label && label !== 'You') return label;

  return 'Unknown relative';
}
