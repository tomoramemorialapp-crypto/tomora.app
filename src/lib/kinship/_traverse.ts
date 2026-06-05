import { EDGE_TYPE_PRIORITY, GENERATION_DELTA, STATUS_PRIORITY } from './constants';
import type { KinshipNode, RelationshipEdge } from './types';

export interface Neighbor {
  nodeId: string;
  genDelta: number;
  edge: RelationshipEdge;
  weight: number;
}

export interface TraversalResult {
  /** generation offset relative to anchor (anchor = 0). */
  gen: number;
  /** node-id path from anchor to this node (inclusive of both). */
  path: string[];
  /** cumulative traversal cost (lower = more "meaningful" path). */
  cost: number;
}

function edgeWeight(edge: RelationshipEdge): number {
  const statusRank = STATUS_PRIORITY[edge.status] ?? 5;
  const typeRank = EDGE_TYPE_PRIORITY[edge.type] ?? 5;
  // Primarily fewest hops, then prefer confirmed, then preferred edge type.
  return 1 + statusRank * 0.01 + typeRank * 0.0001;
}

/** Generation delta moving FROM `at` TO `other` across `edge`. */
function deltaFor(edge: RelationshipEdge, at: string, other: string): number {
  switch (edge.type) {
    case 'parent_child': {
      // fromNodeId = parent, toNodeId = child (canonical orientation).
      const movingToParent = other === edge.fromNodeId;
      return movingToParent ? GENERATION_DELTA.PARENT_CHILD_UP : GENERATION_DELTA.PARENT_CHILD_DOWN;
    }
    case 'pet_owner': {
      // fromNodeId = owner, toNodeId = pet. Pet sits on a companion sub-layer below.
      const movingToPet = other === edge.toNodeId;
      return movingToPet ? GENERATION_DELTA.PET_COMPANION : -GENERATION_DELTA.PET_COMPANION;
    }
    case 'placeholder_bridge': {
      const md = (edge.metadata?.genDelta as number) ?? 0;
      // direction is expressed relative to `from`; flip if traversing backwards.
      return other === edge.toNodeId ? md : -md;
    }
    // partnership, sibling, friend, chosen_family, guardian_managed → same generation
    default:
      return GENERATION_DELTA.SAME;
  }
}

function buildAdjacency(edges: RelationshipEdge[]): Map<string, Neighbor[]> {
  const adj = new Map<string, Neighbor[]>();
  const add = (from: string, n: Neighbor) => {
    const list = adj.get(from);
    if (list) list.push(n);
    else adj.set(from, [n]);
  };
  // Sort edges for deterministic neighbor ordering.
  const sorted = [...edges].filter((e) => e.status !== 'rejected').sort((a, b) => a.id.localeCompare(b.id));
  for (const edge of sorted) {
    const w = edgeWeight(edge);
    add(edge.fromNodeId, {
      nodeId: edge.toNodeId,
      genDelta: deltaFor(edge, edge.fromNodeId, edge.toNodeId),
      edge,
      weight: w,
    });
    add(edge.toNodeId, {
      nodeId: edge.fromNodeId,
      genDelta: deltaFor(edge, edge.toNodeId, edge.fromNodeId),
      edge,
      weight: w,
    });
  }
  return adj;
}

function pathLess(a: string[], b: string[]): boolean {
  return a.join('>').localeCompare(b.join('>')) < 0;
}

/**
 * Deterministic shortest-meaningful-path traversal from the anchor across the
 * relationship graph. Returns generation offset, kinship path, and cost for
 * every reachable node. Ties are broken by the lexical node-id path so the same
 * input always yields the same result.
 */
export function traverseFromAnchor(params: {
  anchorNodeId: string;
  nodes: KinshipNode[];
  edges: RelationshipEdge[];
}): Map<string, TraversalResult> {
  const { anchorNodeId, nodes, edges } = params;
  const known = new Set(nodes.map((n) => n.id));
  const adj = buildAdjacency(edges);

  const best = new Map<string, TraversalResult>();
  if (!known.has(anchorNodeId)) return best;
  best.set(anchorNodeId, { gen: 0, path: [anchorNodeId], cost: 0 });

  const settled = new Set<string>();

  while (settled.size < best.size) {
    // pick the unsettled node with the smallest cost (ties: lexical path).
    let current: string | undefined;
    let currentRes: TraversalResult | undefined;
    for (const [id, res] of best) {
      if (settled.has(id)) continue;
      if (
        !currentRes ||
        res.cost < currentRes.cost ||
        (res.cost === currentRes.cost && pathLess(res.path, currentRes.path))
      ) {
        current = id;
        currentRes = res;
      }
    }
    if (!current || !currentRes) break;
    settled.add(current);

    const neighbors = adj.get(current) ?? [];
    for (const n of neighbors) {
      if (!known.has(n.nodeId) || settled.has(n.nodeId)) continue;
      const nextCost = currentRes.cost + n.weight;
      const nextPath = [...currentRes.path, n.nodeId];
      const nextGen = currentRes.gen + n.genDelta;
      const existing = best.get(n.nodeId);
      if (
        !existing ||
        nextCost < existing.cost - 1e-9 ||
        (Math.abs(nextCost - existing.cost) < 1e-9 && pathLess(nextPath, existing.path))
      ) {
        best.set(n.nodeId, { gen: nextGen, path: nextPath, cost: nextCost });
      }
    }
  }

  return best;
}
