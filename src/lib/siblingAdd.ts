/**
 * Sibling add flow — reuse known parents, prompt when none exist (§1.2).
 */

import { findParentsOfChild } from '@/lib/parentPairing';
import type { Relationship, RelationshipType } from '@/types/models';

export const UNBRIDGED_SIBLING_TAG = 'Unbridged sibling';

export type SiblingBridgeMode = 'shared_unknown_parent' | 'unbridged' | 'add_parent_now';

export function isSiblingRelationshipType(type: RelationshipType): boolean {
  return type === 'sibling';
}

/** True when adding a sibling to `childId` but no parent edges exist yet. */
export function needsSiblingBridgePrompt(childId: string, relationships: Relationship[]): boolean {
  return findParentsOfChild(childId, relationships).length === 0;
}

export interface InferredSiblingParentEdge {
  fromNodeId: string;
  toNodeId: string;
  relationshipType: 'parent' | 'step_parent';
}

/**
 * When `childId` already has parents, link the new sibling to the same parent(s).
 * Stored edges: [to] is [from]'s parent → from new sibling, to parent, type parent.
 */
export function inferSiblingParentEdges(params: {
  childId: string;
  newSiblingId: string;
  relationships: Relationship[];
}): InferredSiblingParentEdge[] {
  const { childId, newSiblingId, relationships } = params;
  const parentIds = findParentsOfChild(childId, relationships);
  const inferred: InferredSiblingParentEdge[] = [];

  for (const parentId of parentIds) {
    const parentRel = relationships.find(
      (r) =>
        r.fromNodeId === childId &&
        r.toNodeId === parentId &&
        (r.relationshipType === 'parent' || r.relationshipType === 'step_parent'),
    );
    const type = parentRel?.relationshipType === 'step_parent' ? 'step_parent' : 'parent';
    if (inferred.some((e) => e.toNodeId === parentId)) continue;
    inferred.push({
      fromNodeId: newSiblingId,
      toNodeId: parentId,
      relationshipType: type,
    });
  }

  return inferred;
}

export function tagsForSiblingBridgeMode(mode: SiblingBridgeMode): string[] | undefined {
  if (mode === 'unbridged') return [UNBRIDGED_SIBLING_TAG];
  return undefined;
}
