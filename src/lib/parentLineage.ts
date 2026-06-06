/**
 * Distinguishes biological, step, and in-law parent links for storage, labels,
 * and Family Tree line styling.
 */

import type { Relationship, RelationshipType } from '@/types/models';
import type { LineStyle, RelationshipEdge } from '@/lib/kinship/types';

export type ParentLineageKind = 'biological' | 'step' | 'in_law';

export const PARENT_LINEAGE_TYPES: RelationshipType[] = ['parent', 'step_parent', 'parent_in_law'];

export function isParentLineageType(type: RelationshipType): boolean {
  return PARENT_LINEAGE_TYPES.includes(type);
}

export function parentLineageFromRelationshipType(type: RelationshipType): ParentLineageKind {
  switch (type) {
    case 'step_parent':
      return 'step';
    case 'parent_in_law':
      return 'in_law';
    default:
      return 'biological';
  }
}

/** Kinship `fromRole` stored on parent_child edges. */
export function parentRoleForLineage(kind: ParentLineageKind): string {
  switch (kind) {
    case 'step':
      return 'step_parent';
    case 'in_law':
      return 'parent_in_law';
    default:
      return 'parent';
  }
}

export function parentLineageKindFromEdge(edge: RelationshipEdge): ParentLineageKind | null {
  if (edge.type !== 'parent_child') return null;
  if (edge.fromRole === 'step_parent') return 'step';
  if (edge.fromRole === 'parent_in_law') return 'in_law';
  return 'biological';
}

export function lineStyleForParentLineage(kind: ParentLineageKind): LineStyle {
  switch (kind) {
    case 'step':
      return 'dashed';
    case 'in_law':
      return 'dotted';
    default:
      return 'solid';
  }
}

export function parentLineageLabel(kind: ParentLineageKind): string {
  switch (kind) {
    case 'step':
      return 'Step-parent';
    case 'in_law':
      return 'Parent-in-law';
    default:
      return 'Biological parent';
  }
}

export function relationshipTypeLabel(type: RelationshipType): string {
  switch (type) {
    case 'step_parent':
      return 'step-parent';
    case 'parent_in_law':
      return 'parent-in-law';
    case 'parent':
      return 'parent';
    default:
      return type.replace(/_/g, ' ');
  }
}
