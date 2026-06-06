import { classifyBranches } from './branches';
import { routeEdges } from './edgeRouter';
import { computeGenerationOffsetsWithWarnings } from './generation';
import { computeKinshipLayout } from './layout';
import { getRelationshipLabel } from './pathExplainer';
import { computeKinshipPaths } from './resolver';
import type {
  FamilyUnit,
  KinshipNode,
  KinshipRenderGraph,
  KinshipWarning,
  RelationshipEdge,
  ResolveKinshipInput,
} from './types';

export * from './types';
export { getRelationshipLabel, getRelationshipExplanation } from './pathExplainer';
export { buildRelationshipWithPlaceholders } from './placeholders';
export type { AddRelationshipIntent, RelationshipToAnchor } from './placeholders';
export { computeGenerationOffsets } from './generation';
export { computeKinshipPaths } from './resolver';

function buildFamilyUnits(params: {
  familyTreeId: string;
  nodes: KinshipNode[];
  edges: RelationshipEdge[];
  generationOffsets: Map<string, number>;
}): FamilyUnit[] {
  const { familyTreeId, edges, generationOffsets } = params;
  const childrenOf = new Map<string, Set<string>>();
  for (const e of edges) {
    if (e.type !== 'parent_child') continue;
    const set = childrenOf.get(e.fromNodeId) ?? new Set<string>();
    set.add(e.toNodeId);
    childrenOf.set(e.fromNodeId, set);
  }

  const units: FamilyUnit[] = [];
  const usedParents = new Set<string>();

  for (const e of edges) {
    if (e.type !== 'partnership') continue;
    const partners = [e.fromNodeId, e.toNodeId].sort();
    const childIds = new Set<string>();
    for (const p of partners) (childrenOf.get(p) ?? new Set()).forEach((c) => childIds.add(c));
    partners.forEach((p) => usedParents.add(p));
    units.push({
      id: `unit:${partners.join('+')}`,
      familyTreeId,
      partnerNodeIds: partners,
      childNodeIds: [...childIds].sort(),
      generationOffset: generationOffsets.get(partners[0]) ?? 0,
    });
  }

  for (const [parent, kids] of childrenOf) {
    if (usedParents.has(parent)) continue;
    units.push({
      id: `unit:${parent}`,
      familyTreeId,
      partnerNodeIds: [parent],
      childNodeIds: [...kids].sort(),
      generationOffset: generationOffsets.get(parent) ?? 0,
    });
  }

  return units.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * The Tomora Kinship Engine entry point. Converts relationship data into a
 * deterministic, render-ready Family Tree graph from the perspective of the
 * selected anchor node.
 */
export function resolveKinshipGraph(input: ResolveKinshipInput): KinshipRenderGraph {
  const { anchorNodeId, nodes, edges, options } = input;
  const mode = options?.mode ?? 'focus';
  const warnings: KinshipWarning[] = [];

  // 1. validate
  const anchor = nodes.find((n) => n.id === anchorNodeId);
  if (!anchor) {
    return { anchorNodeId, nodes: [], edges: [], familyUnits: [], warnings: [{ code: 'no_anchor', message: 'Anchor node not found.' }] };
  }

  // 2. privacy filter (MVP passthrough; real filtering is post-MVP)
  const filteredNodes = nodes;
  const filteredEdges = edges.filter((e) => e.status !== 'rejected');

  // 3. paths + 4. generations
  const paths = computeKinshipPaths({ anchorNodeId, nodes: filteredNodes, edges: filteredEdges });
  const genResult = computeGenerationOffsetsWithWarnings({ anchorNodeId, nodes: filteredNodes, edges: filteredEdges });
  warnings.push(...genResult.warnings);
  const offsets = genResult.offsets;

  // 5. mode-based scoping
  const maxUp = options?.maxGenerationsUp ?? (mode === 'full' ? Infinity : mode === 'household' ? 0 : 3);
  const maxDown = options?.maxGenerationsDown ?? (mode === 'full' ? Infinity : 3);

  // 6. branches
  const branchMap = classifyBranches({ anchorNodeId, nodes: filteredNodes, edges: filteredEdges, paths });

  // 7. enrich + scope nodes
  const labelAnchorAsYou =
    !options?.homeAnchorNodeId || anchorNodeId === options.homeAnchorNodeId;
  const includedIds = new Set<string>();
  const enriched: KinshipNode[] = [];
  for (const n of filteredNodes) {
    const gen = offsets.get(n.id);
    if (gen === undefined) continue; // unreachable from anchor
    if (gen > maxUp || gen < -maxDown) continue;
    const branchType = branchMap.get(n.id) ?? n.branchType ?? 'unsorted';
    if (mode === 'branch' && options?.branchType && n.id !== anchorNodeId && branchType !== options.branchType) {
      continue;
    }
    const path = paths.get(n.id) ?? [n.id];
    const enrichedNode: KinshipNode = {
      ...n,
      branchType,
      generationOffset: gen,
      kinshipPathFromAnchor: path,
      relationshipLabelFromAnchor: getRelationshipLabel({
        anchorNodeId,
        targetNodeId: n.id,
        path,
        nodes: filteredNodes.map((x) => ({ ...x, branchType: branchMap.get(x.id) ?? x.branchType })),
        edges: filteredEdges,
        labelAnchorAsYou,
      }),
    };
    enriched.push(enrichedNode);
    includedIds.add(n.id);
  }

  // 8. family units (over the visible set)
  const scopedEdges = filteredEdges.filter((e) => includedIds.has(e.fromNodeId) && includedIds.has(e.toNodeId));
  const familyUnits = buildFamilyUnits({ familyTreeId: anchor.familyTreeId, nodes: enriched, edges: scopedEdges, generationOffsets: offsets });

  // 9. layout
  const renderNodes = computeKinshipLayout({
    anchorNodeId,
    nodes: enriched,
    edges: scopedEdges,
    familyUnits,
    generationOffsets: offsets,
  });

  // 10. route edges
  const renderEdges = routeEdges({ nodes: renderNodes, edges: scopedEdges });

  return { anchorNodeId, nodes: renderNodes, edges: renderEdges, familyUnits, warnings };
}
