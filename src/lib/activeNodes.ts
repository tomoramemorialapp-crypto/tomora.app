import type { FamilyNode, NodeStatus } from '@/types/models';

const INACTIVE_STATUSES: ReadonlySet<NodeStatus> = new Set(['archived', 'deleted']);

/** Whether a node should appear in selectors, search, and the active Family Tree. */
export function isActiveNode(node: Pick<FamilyNode, 'status' | 'deletedAt'>): boolean {
  if (node.deletedAt) return false;
  return !INACTIVE_STATUSES.has(node.status);
}

/** Filter to nodes that are part of the live Family Tree. */
export function activeNodes(nodes: FamilyNode[]): FamilyNode[] {
  return nodes.filter(isActiveNode);
}
