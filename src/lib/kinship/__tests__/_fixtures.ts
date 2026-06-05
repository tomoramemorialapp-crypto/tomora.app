import { buildRelationshipWithPlaceholders, type RelationshipToAnchor } from '../placeholders';
import type { KinshipNode, RelationshipEdge } from '../types';

export const ANCHOR_ID = 'anchor';

export function anchorNode(): KinshipNode {
  return {
    id: ANCHOR_ID,
    familyTreeId: 't',
    displayName: 'You',
    nodeType: 'person',
    status: 'claimed',
    visibility: 'family_tree',
    isAnchor: true,
  };
}

export interface IntentSpec {
  id: string;
  name: string;
  rel: RelationshipToAnchor;
  side?: 'mother_side' | 'father_side' | 'partner_side' | 'unsorted';
}

/** Assemble a normalized graph by applying a sequence of add-relationship intents. */
export function buildGraph(intents: IntentSpec[]): { nodes: KinshipNode[]; edges: RelationshipEdge[] } {
  const nodes: KinshipNode[] = [anchorNode()];
  const edges: RelationshipEdge[] = [];

  for (const it of intents) {
    const res = buildRelationshipWithPlaceholders({
      intent: {
        anchorNodeId: ANCHOR_ID,
        targetDisplayName: it.name,
        relationshipToAnchor: it.rel,
        side: it.side ?? 'unsorted',
        targetNodeId: it.id,
      },
      existingNodes: nodes,
      existingEdges: edges,
      familyTreeId: 't',
    });
    for (const n of res.nodesToCreate) if (!nodes.some((x) => x.id === n.id)) nodes.push(n);
    edges.push(...res.edgesToCreate);
  }

  return { nodes, edges };
}
