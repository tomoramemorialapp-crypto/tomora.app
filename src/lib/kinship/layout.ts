import { LAYER_Y_SPACING, NODE_X_SPACING } from './constants';
import type { BranchType, FamilyUnit, KinshipNode, RelationshipEdge, RenderNode } from './types';

const BRANCH_ORDER: Record<BranchType, number> = {
  father_side: 0,
  unsorted: 1,
  self: 2,
  partner_side: 3,
  mother_side: 4,
  chosen_family: 5,
  pet_companion: 6,
};

function sideFor(x: number): 'left' | 'right' | 'center' {
  if (x < -1e-6) return 'left';
  if (x > 1e-6) return 'right';
  return 'center';
}

/**
 * Deterministic layered layout. Nodes are stacked by generation (higher = above),
 * ordered left→right by branch so paternal lines sit left and maternal lines
 * right, with the anchor pinned to x = 0. Equal-layer nodes are evenly spaced so
 * they never overlap. The same input always yields the same coordinates.
 */
export function computeKinshipLayout(params: {
  anchorNodeId: string;
  nodes: KinshipNode[];
  edges: RelationshipEdge[];
  familyUnits: FamilyUnit[];
  generationOffsets: Map<string, number>;
}): RenderNode[] {
  const { anchorNodeId, nodes, edges, generationOffsets } = params;

  const visible = nodes.filter((n) => generationOffsets.has(n.id));
  const byId = new Map(visible.map((n) => [n.id, n]));

  // Group by generation offset.
  const layers = new Map<number, KinshipNode[]>();
  for (const n of visible) {
    const gen = generationOffsets.get(n.id)!;
    const list = layers.get(gen);
    if (list) list.push(n);
    else layers.set(gen, [n]);
  }

  // Sort unique generations descending: highest generation renders at the top.
  const gens = [...layers.keys()].sort((a, b) => b - a);

  const out = new Map<string, RenderNode>();

  gens.forEach((gen, layerIndex) => {
    const layerNodes = layers.get(gen)!;
    // Deterministic ordering: branch, then kinship path, then id.
    layerNodes.sort((a, b) => {
      const ba = BRANCH_ORDER[a.branchType ?? 'unsorted'];
      const bb = BRANCH_ORDER[b.branchType ?? 'unsorted'];
      if (ba !== bb) return ba - bb;
      const pa = (a.kinshipPathFromAnchor ?? [a.id]).join('>');
      const pb = (b.kinshipPathFromAnchor ?? [b.id]).join('>');
      if (pa !== pb) return pa.localeCompare(pb);
      return a.id.localeCompare(b.id);
    });

    // Center the layer; pin the anchor's layer so the anchor sits at x = 0.
    const anchorIdx = layerNodes.findIndex((n) => n.id === anchorNodeId);
    const centerIdx = anchorIdx >= 0 ? anchorIdx : (layerNodes.length - 1) / 2;
    const y = -gen * LAYER_Y_SPACING;

    layerNodes.forEach((n, i) => {
      const x = (i - centerIdx) * NODE_X_SPACING;
      out.set(n.id, {
        ...n,
        generationOffset: gen,
        visualLayer: layerIndex,
        branchType: n.branchType ?? 'unsorted',
        relationshipLabelFromAnchor: n.relationshipLabelFromAnchor ?? '',
        kinshipPathFromAnchor: n.kinshipPathFromAnchor ?? [n.id],
        layout: { x, y, layer: layerIndex, order: i, side: sideFor(x) },
      });
    });
  });

  // Align pets beneath their owner cluster for a calmer companion layer.
  for (const edge of edges) {
    if (edge.type !== 'pet_owner') continue;
    const pet = out.get(edge.toNodeId);
    const owner = out.get(edge.fromNodeId);
    if (!pet || !owner) continue;
    pet.layout.x = owner.layout.x;
    pet.layout.side = sideFor(pet.layout.x);
  }
  // Nudge apart any pets that ended up stacked on the same point.
  resolvePetCollisions(out);

  return [...out.values()];
}

function resolvePetCollisions(out: Map<string, RenderNode>) {
  const pets = [...out.values()].filter((n) => n.nodeType === 'pet');
  const seen = new Map<string, number>();
  for (const p of pets.sort((a, b) => a.id.localeCompare(b.id))) {
    const key = `${p.layout.layer}:${Math.round(p.layout.x)}`;
    const n = seen.get(key) ?? 0;
    if (n > 0) {
      p.layout.x += n * (NODE_X_SPACING * 0.6);
      p.layout.side = sideFor(p.layout.x);
    }
    seen.set(key, n + 1);
  }
}
