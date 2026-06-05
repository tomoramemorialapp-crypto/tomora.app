import { traverseFromAnchor } from './_traverse';
import type { KinshipNode, RelationshipEdge, KinshipWarning } from './types';

export interface GenerationResult {
  offsets: Map<string, number>;
  warnings: KinshipWarning[];
}

/**
 * Compute the generation offset of every reachable node relative to the anchor.
 * Anchor = 0, parents = +1 (above), children = -1 (below), grandparents = +2,
 * etc. Pets sit on a companion sub-layer just below their owner.
 *
 * Conflicts (a node reachable via paths that disagree on generation) are
 * resolved by the deterministic shortest-meaningful path and surfaced as
 * warnings.
 */
export function computeGenerationOffsets(params: {
  anchorNodeId: string;
  nodes: KinshipNode[];
  edges: RelationshipEdge[];
}): Map<string, number> {
  return computeGenerationOffsetsWithWarnings(params).offsets;
}

export function computeGenerationOffsetsWithWarnings(params: {
  anchorNodeId: string;
  nodes: KinshipNode[];
  edges: RelationshipEdge[];
}): GenerationResult {
  const result = traverseFromAnchor(params);
  const offsets = new Map<string, number>();
  const warnings: KinshipWarning[] = [];

  for (const [nodeId, res] of result) {
    offsets.set(nodeId, res.gen);
  }

  // Detect generation conflicts: any confirmed/structural edge whose endpoints'
  // resolved generations are inconsistent with the edge's expected delta.
  for (const edge of params.edges) {
    if (edge.status === 'rejected') continue;
    const a = offsets.get(edge.fromNodeId);
    const b = offsets.get(edge.toNodeId);
    if (a === undefined || b === undefined) continue;
    let expected: number | null = null;
    if (edge.type === 'parent_child') expected = 1; // child(to) - parent(from) ... |a-b| should be 1
    else if (edge.type === 'partnership' || edge.type === 'sibling') expected = 0;
    if (expected === null) continue;
    const diff = Math.abs(a - b);
    if (Math.abs(diff - expected) > 1e-6) {
      warnings.push({
        code: 'generation_conflict',
        message: `Conflicting generations across a ${edge.type} connection.`,
        edgeIds: [edge.id],
        nodeIds: [edge.fromNodeId, edge.toNodeId],
      });
    }
  }

  return { offsets, warnings };
}
