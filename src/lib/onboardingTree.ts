import type { FamilyNode, FamilyTree, Relationship } from '@/types/models';

type OnboardingTreeBundle = {
  tree: FamilyTree | null;
  nodes: FamilyNode[];
  relationships: Relationship[];
};

/** Whether the user's primary tree already has a claimed self node and first connection. */
export function isOnboardingTreeComplete(bundle: OnboardingTreeBundle | null, accountId: string): boolean {
  if (!bundle?.tree) return false;
  const selfNode = bundle.nodes.find((n) => n.ownerAccountId === accountId && n.status === 'claimed');
  if (!selfNode) return false;
  const connected = bundle.relationships.some(
    (r) => r.fromNodeId === selfNode.id || r.toNodeId === selfNode.id,
  );
  return bundle.nodes.length >= 2 && connected;
}

export type MinimalTreeBundle = {
  tree: { id: string } | null;
  nodes: Pick<FamilyNode, 'id' | 'ownerAccountId' | 'status'>[];
  relationships: Pick<Relationship, 'fromNodeId' | 'toNodeId'>[];
};

/** Same as isOnboardingTreeComplete but accepts minimal node/edge shapes (for unit tests). */
export function isMinimalOnboardingTreeComplete(bundle: MinimalTreeBundle | null, accountId: string): boolean {
  if (!bundle?.tree) return false;
  const selfNode = bundle.nodes.find((n) => n.ownerAccountId === accountId && n.status === 'claimed');
  if (!selfNode) return false;
  const connected = bundle.relationships.some(
    (r) => r.fromNodeId === selfNode.id || r.toNodeId === selfNode.id,
  );
  return bundle.nodes.length >= 2 && connected;
}
