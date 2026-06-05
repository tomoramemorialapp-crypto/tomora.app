import type { BranchType, KinshipNode, RelationshipEdge } from './types';

function edgeBetween(edges: RelationshipEdge[], a: string, b: string): RelationshipEdge | undefined {
  const matches = edges.filter(
    (e) =>
      e.status !== 'rejected' &&
      ((e.fromNodeId === a && e.toNodeId === b) || (e.fromNodeId === b && e.toNodeId === a)),
  );
  matches.sort((x, y) => x.id.localeCompare(y.id));
  return matches[0];
}

/**
 * Classify every reachable node into a branch relative to the anchor:
 *   self, mother_side, father_side, partner_side, chosen_family, pet_companion,
 *   or unsorted. A node inherits the side implied by its first hop away from the
 *   anchor (e.g. a cousin reached via the mother is mother_side).
 *
 * Maternal and paternal branches stay separate unless an explicit edge links
 * them.
 */
export function classifyBranches(params: {
  anchorNodeId: string;
  nodes: KinshipNode[];
  edges: RelationshipEdge[];
  paths: Map<string, string[]>;
}): Map<string, BranchType> {
  const { anchorNodeId, nodes, edges, paths } = params;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const result = new Map<string, BranchType>();

  for (const node of nodes) {
    const id = node.id;
    if (id === anchorNodeId) {
      result.set(id, 'self');
      continue;
    }
    if (node.nodeType === 'pet') {
      result.set(id, 'pet_companion');
      continue;
    }

    const path = paths.get(id);
    if (!path || path.length < 2) {
      result.set(id, node.branchType ?? 'unsorted');
      continue;
    }

    const firstHop = path[1];
    const edge = edgeBetween(edges, anchorNodeId, firstHop);
    result.set(id, classifyFirstHop(edge, anchorNodeId, firstHop, byId));
  }

  return result;
}

function classifyFirstHop(
  edge: RelationshipEdge | undefined,
  anchorId: string,
  firstHop: string,
  byId: Map<string, KinshipNode>,
): BranchType {
  if (!edge) return 'unsorted';
  switch (edge.type) {
    case 'parent_child': {
      // firstHop is a parent of the anchor → take that parent's side.
      if (edge.toNodeId === anchorId) {
        const parent = byId.get(firstHop);
        if (edge.fromRole === 'mother') return 'mother_side';
        if (edge.fromRole === 'father') return 'father_side';
        return parent?.branchType ?? 'unsorted';
      }
      // firstHop is a child of the anchor → your own line.
      return 'self';
    }
    case 'partnership':
      return 'partner_side';
    case 'sibling':
      return 'self';
    case 'pet_owner':
      return 'pet_companion';
    case 'friend':
    case 'chosen_family':
      return 'chosen_family';
    default:
      return 'self';
  }
}
