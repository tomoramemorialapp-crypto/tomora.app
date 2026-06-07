import { suggestDetailForType } from '@/lib/relationshipDetail';
import type { FamilyNode, Relationship, RelationshipDetail, RelationshipType } from '@/types/models';

export const PARENT_EDGE_TYPES: RelationshipType[] = ['parent', 'step_parent'];

export interface ParentPairingOpportunity {
  childId: string;
  childName: string;
  parentAId: string;
  parentAName: string;
  parentBId: string;
  parentBName: string;
}

export type ParentPartnershipChoice = 'spouse' | 'partner' | 'former_partner' | 'co_parent_only';

export type PartnershipLifecycle = 'current' | 'separated' | 'divorced' | 'widowed' | 'unknown';

/** Statuses that store a former spouse/partner detail on the edge. */
export function partnershipUsesFormerDetail(
  choice: Exclude<ParentPartnershipChoice, 'co_parent_only'>,
  lifecycle: PartnershipLifecycle,
): boolean {
  if (choice === 'former_partner') return true;
  return lifecycle === 'separated' || lifecycle === 'divorced';
}

/** Parents linked to `childId` via stored parent / step-parent edges (child → parent). */
export function findParentsOfChild(childId: string, relationships: Relationship[]): string[] {
  const parents: string[] = [];
  const seen = new Set<string>();
  for (const rel of relationships) {
    if (rel.fromNodeId !== childId || !PARENT_EDGE_TYPES.includes(rel.relationshipType)) continue;
    if (seen.has(rel.toNodeId)) continue;
    seen.add(rel.toNodeId);
    parents.push(rel.toNodeId);
  }
  return parents;
}

export function hasPartnershipBetween(
  parentAId: string,
  parentBId: string,
  relationships: Relationship[],
): boolean {
  return relationships.some(
    (rel) =>
      (rel.relationshipType === 'spouse' || rel.relationshipType === 'partner') &&
      ((rel.fromNodeId === parentAId && rel.toNodeId === parentBId) ||
        (rel.fromNodeId === parentBId && rel.toNodeId === parentAId)),
  );
}

/**
 * After a parent edge is added, return an unpaired parent pair for the same child — if any.
 * Never auto-creates a partnership; callers show a confirmation prompt.
 */
export function detectParentPairingOpportunity(params: {
  childId: string;
  nodes: FamilyNode[];
  relationships: Relationship[];
}): ParentPairingOpportunity | null {
  const { childId, nodes, relationships } = params;
  const parents = findParentsOfChild(childId, relationships);
  if (parents.length < 2) return null;

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const child = nodeById.get(childId);
  if (!child) return null;

  for (let i = 0; i < parents.length; i++) {
    for (let j = i + 1; j < parents.length; j++) {
      const parentAId = parents[i]!;
      const parentBId = parents[j]!;
      if (hasPartnershipBetween(parentAId, parentBId, relationships)) continue;

      const parentA = nodeById.get(parentAId);
      const parentB = nodeById.get(parentBId);
      if (!parentA || !parentB) continue;

      return {
        childId,
        childName: child.displayName,
        parentAId,
        parentAName: parentA.displayName,
        parentBId,
        parentBName: parentB.displayName,
      };
    }
  }

  return null;
}

/** Resolve the child node when a parent / step-parent edge was just authored. */
export function childIdForParentEdge(relationshipType: RelationshipType, fromNodeId: string): string | null {
  return PARENT_EDGE_TYPES.includes(relationshipType) ? fromNodeId : null;
}

export function buildParentPartnershipEdge(params: {
  fromParentId: string;
  toParentId: string;
  choice: Exclude<ParentPartnershipChoice, 'co_parent_only'>;
  lifecycle?: PartnershipLifecycle;
  husbandParentId?: string;
  nodes: FamilyNode[];
}): {
  fromNodeId: string;
  toNodeId: string;
  relationshipType: RelationshipType;
  relationshipDetail?: RelationshipDetail;
} {
  const { fromParentId, toParentId, choice, husbandParentId, nodes } = params;
  const lifecycle = params.lifecycle ?? 'current';
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const useFormer = partnershipUsesFormerDetail(choice, lifecycle);

  if (choice === 'partner' || choice === 'former_partner') {
    return {
      fromNodeId: fromParentId,
      toNodeId: toParentId,
      relationshipType: 'partner',
      relationshipDetail: useFormer ? 'former_partner' : undefined,
    };
  }

  const husbandId = husbandParentId ?? fromParentId;
  const wifeId = husbandId === fromParentId ? toParentId : fromParentId;
  const wife = nodeById.get(wifeId);
  const spouseDetail = suggestDetailForType('spouse', wife ?? ({ displayName: 'Partner' } as FamilyNode)) ?? 'wife';

  const relationshipDetail: RelationshipDetail | undefined = useFormer
    ? spouseDetail === 'husband'
      ? 'former_husband'
      : 'former_wife'
    : spouseDetail;

  return {
    fromNodeId: husbandId,
    toNodeId: wifeId,
    relationshipType: 'spouse',
    relationshipDetail,
  };
}
