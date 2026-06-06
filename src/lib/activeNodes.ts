import type { FamilyNode, NodeStatus, Relationship } from '@/types/models';

const INACTIVE_STATUSES: ReadonlySet<NodeStatus> = new Set(['archived', 'deleted', 'vacated']);

/** Whether a node should appear in selectors, search, and the active Family Tree. */
export function isActiveNode(node: Pick<FamilyNode, 'status' | 'deletedAt'>): boolean {
  if (node.deletedAt) return false;
  return !INACTIVE_STATUSES.has(node.status);
}

/** Filter to nodes that are part of the live Family Tree. */
export function activeNodes(nodes: FamilyNode[]): FamilyNode[] {
  return nodes.filter(isActiveNode);
}

/** Keep only edges whose endpoints are both active nodes. */
export function activeRelationships(nodes: FamilyNode[], relationships: Relationship[]): Relationship[] {
  const ids = new Set(activeNodes(nodes).map((n) => n.id));
  return relationships.filter((r) => ids.has(r.fromNodeId) && ids.has(r.toNodeId));
}
