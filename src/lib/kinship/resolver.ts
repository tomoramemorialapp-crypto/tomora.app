import { traverseFromAnchor } from './_traverse';
import type { KinshipNode, RelationshipEdge } from './types';

/**
 * Compute the shortest meaningful kinship path (as node ids) from the anchor to
 * every reachable node. Example — a cousin resolves to:
 *   [anchorId, motherId, auntId, cousinId]
 *
 * Path selection prefers confirmed lineage over inferred/placeholder bridges and
 * is fully deterministic for a given input.
 */
export function computeKinshipPaths(params: {
  anchorNodeId: string;
  nodes: KinshipNode[];
  edges: RelationshipEdge[];
}): Map<string, string[]> {
  const result = traverseFromAnchor(params);
  const paths = new Map<string, string[]>();
  for (const [nodeId, res] of result) {
    paths.set(nodeId, res.path);
  }
  return paths;
}

/** The set of node ids reachable from the anchor (everything the engine renders). */
export function reachableNodeIds(params: {
  anchorNodeId: string;
  nodes: KinshipNode[];
  edges: RelationshipEdge[];
}): Set<string> {
  return new Set(traverseFromAnchor(params).keys());
}
