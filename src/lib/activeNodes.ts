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

/** Prefer the signed-in user's node as the connectivity anchor. */
export function findTreeAnchorId(nodes: FamilyNode[]): string | undefined {
  const live = activeNodes(nodes);
  return live.find((n) => n.ownerAccountId)?.id ?? live[0]?.id;
}

/** Node ids reachable from the anchor through approved relationship edges. */
export function reachableNodeIds(
  nodes: FamilyNode[],
  relationships: Relationship[],
  anchorNodeId: string,
): Set<string> {
  const liveIds = new Set(activeNodes(nodes).map((n) => n.id));
  const adj = new Map<string, string[]>();

  const link = (a: string, b: string) => {
    if (!liveIds.has(a) || !liveIds.has(b)) return;
    const fromA = adj.get(a);
    if (fromA) fromA.push(b);
    else adj.set(a, [b]);
    const fromB = adj.get(b);
    if (fromB) fromB.push(a);
    else adj.set(b, [a]);
  };

  for (const r of relationships) {
    link(r.fromNodeId, r.toNodeId);
  }

  const reached = new Set<string>();
  const stack = [anchorNodeId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (reached.has(id) || !liveIds.has(id)) continue;
    reached.add(id);
    for (const next of adj.get(id) ?? []) stack.push(next);
  }
  return reached;
}

/**
 * Nodes that belong to the live Family Tree — active and connected to the
 * anchor. Orphaned profiles (e.g. after removing their last connection) are
 * excluded from selectors and tree views.
 */
export function treeMemberNodes(
  nodes: FamilyNode[],
  relationships: Relationship[],
  anchorNodeId: string | undefined,
): FamilyNode[] {
  const live = activeNodes(nodes);
  if (!anchorNodeId || !live.some((n) => n.id === anchorNodeId)) return live;
  const reached = reachableNodeIds(live, relationships, anchorNodeId);
  return live.filter((n) => reached.has(n.id));
}
