import type { RelationshipEdge } from './types';
import type { RelationshipToAnchor } from './placeholders';

type EdgeLike = Pick<RelationshipEdge, 'type' | 'fromNodeId' | 'toNodeId'>;

/** Direct first-degree additions never need synthetic parent bridge nodes. */
const DIRECT_FIRST_DEGREE: ReadonlySet<RelationshipToAnchor> = new Set([
  'father',
  'mother',
  'parent',
  'child',
  'partner',
  'pet',
]);

/** Collect parent node ids for `childId` from parent_child edges. */
export function findKnownParents(childId: string, edges: EdgeLike[]): string[] {
  const parents: string[] = [];
  const seen = new Set<string>();
  for (const e of edges) {
    if (e.type !== 'parent_child' || e.toNodeId !== childId) continue;
    if (seen.has(e.fromNodeId)) continue;
    seen.add(e.fromNodeId);
    parents.push(e.fromNodeId);
  }
  return parents;
}

export function hasKnownParent(anchorId: string, edges: EdgeLike[]): boolean {
  return findKnownParents(anchorId, edges).length > 0;
}

/**
 * Whether TKE should create a synthetic Unknown Parent (or similar bridge) for
 * this relationship addition.
 */
export function shouldCreatePlaceholderBridge(params: {
  relationshipToAnchor: RelationshipToAnchor;
  anchorNodeId: string;
  existingEdges: EdgeLike[];
}): boolean {
  const { relationshipToAnchor, anchorNodeId, existingEdges } = params;

  if (DIRECT_FIRST_DEGREE.has(relationshipToAnchor)) return false;

  if (relationshipToAnchor === 'sibling') {
    return !hasKnownParent(anchorNodeId, existingEdges);
  }

  return true;
}
