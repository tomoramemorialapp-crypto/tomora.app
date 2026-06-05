import type {
  BranchType,
  KinshipNode,
  KinshipWarning,
  RelationshipEdge,
  RelationshipEdgeType,
} from './types';

export type RelationshipToAnchor =
  | 'father'
  | 'mother'
  | 'parent'
  | 'grandparent'
  | 'sibling'
  | 'aunt_uncle'
  | 'cousin'
  | 'child'
  | 'grandchild'
  | 'niece_nephew'
  | 'partner'
  | 'pet';

export interface AddRelationshipIntent {
  anchorNodeId: string;
  targetDisplayName: string;
  relationshipToAnchor: RelationshipToAnchor;
  side?: 'mother_side' | 'father_side' | 'partner_side' | 'unsorted';
  /** When set, connect to this existing node instead of creating the target. */
  targetNodeId?: string;
}

export interface BuildResult {
  nodesToCreate: KinshipNode[];
  edgesToCreate: RelationshipEdge[];
  warnings: KinshipWarning[];
}

interface Ctx {
  familyTreeId: string;
  createdByAccountId?: string;
  existing: Map<string, KinshipNode>;
  created: Map<string, KinshipNode>;
  edges: RelationshipEdge[];
  newEdges: RelationshipEdge[];
  warnings: KinshipWarning[];
}

function sideToBranch(side?: AddRelationshipIntent['side']): BranchType {
  if (side === 'mother_side') return 'mother_side';
  if (side === 'father_side') return 'father_side';
  if (side === 'partner_side') return 'partner_side';
  return 'unsorted';
}

function hasNode(ctx: Ctx, id: string): boolean {
  return ctx.existing.has(id) || ctx.created.has(id);
}

function makePlaceholder(
  ctx: Ctx,
  id: string,
  displayName: string,
  branchType: BranchType,
  roleLabel: string,
): string {
  if (hasNode(ctx, id)) return id;
  ctx.created.set(id, {
    id,
    familyTreeId: ctx.familyTreeId,
    displayName,
    nodeType: 'placeholder',
    status: 'placeholder',
    branchType,
    visibility: 'family_tree',
    metadata: { roleLabel, placeholder: true },
  });
  return id;
}

function edgeId(type: RelationshipEdgeType, from: string, to: string): string {
  return `edge:${type}:${from}->${to}`;
}

function hasEdge(ctx: Ctx, id: string): boolean {
  return ctx.edges.some((e) => e.id === id) || ctx.newEdges.some((e) => e.id === id);
}

function addEdge(
  ctx: Ctx,
  type: RelationshipEdgeType,
  from: string,
  to: string,
  opts: {
    status?: RelationshipEdge['status'];
    fromRole?: string;
    toRole?: string;
  } = {},
): void {
  const id = edgeId(type, from, to);
  if (hasEdge(ctx, id)) return;
  // Avoid duplicate logical partnership/sibling regardless of direction.
  if (type === 'partnership' || type === 'sibling') {
    const reverse = edgeId(type, to, from);
    if (hasEdge(ctx, reverse)) return;
  }
  ctx.newEdges.push({
    id,
    familyTreeId: ctx.familyTreeId,
    fromNodeId: from,
    toNodeId: to,
    type,
    status: opts.status ?? 'confirmed',
    visibility: 'family_tree',
    fromRole: opts.fromRole,
    toRole: opts.toRole,
    createdByAccountId: ctx.createdByAccountId,
    approvedByNodeIds: [],
    metadata: opts.status === 'inferred' ? { inferred: true } : undefined,
  });
}

/** Find an existing parent (parent_child where child === childId) matching a branch. */
function findParent(ctx: Ctx, childId: string, branch: BranchType): string | undefined {
  const all = [...ctx.edges, ...ctx.newEdges];
  for (const e of all) {
    if (e.type !== 'parent_child' || e.toNodeId !== childId) continue;
    const parent = ctx.existing.get(e.fromNodeId) ?? ctx.created.get(e.fromNodeId);
    const parentBranch = parent?.branchType ?? 'unsorted';
    if (branch === 'unsorted' || parentBranch === branch) return e.fromNodeId;
  }
  return undefined;
}

/** Ensure a parent bridge above `childId` on the given branch; reuse if present. */
function ensureParent(ctx: Ctx, childId: string, branch: BranchType): string {
  const existing = findParent(ctx, childId, branch);
  if (existing) return existing;
  const name = branch === 'mother_side' ? 'Mother' : branch === 'father_side' ? 'Father' : 'Unknown Parent';
  const id = makePlaceholder(ctx, `ph:${ctx.familyTreeId}:${branch}:parent:${childId}`, name, branch, 'Parent');
  addEdge(ctx, 'parent_child', id, childId, { status: 'inferred', fromRole: 'parent', toRole: 'child' });
  return id;
}

function ensureSibling(ctx: Ctx, anchorId: string): string {
  const id = makePlaceholder(
    ctx,
    `ph:${ctx.familyTreeId}:self:sibling:${anchorId}`,
    'Unknown Sibling',
    'self',
    'Sibling',
  );
  addEdge(ctx, 'sibling', anchorId, id, { status: 'inferred' });
  return id;
}

function ensureChild(ctx: Ctx, anchorId: string): string {
  const id = makePlaceholder(ctx, `ph:${ctx.familyTreeId}:self:child:${anchorId}`, 'Unknown Child', 'self', 'Child');
  addEdge(ctx, 'parent_child', anchorId, id, { status: 'inferred', fromRole: 'parent', toRole: 'child' });
  return id;
}

function ensureAuntUncle(ctx: Ctx, parentId: string, branch: BranchType): string {
  const id = makePlaceholder(
    ctx,
    `ph:${ctx.familyTreeId}:${branch}:auntuncle:${parentId}`,
    'Unknown Aunt/Uncle',
    branch,
    'Aunt or Uncle',
  );
  addEdge(ctx, 'sibling', parentId, id, { status: 'inferred' });
  return id;
}

/**
 * Build the nodes + edges (including any required placeholder bridge nodes)
 * needed to connect `target` to the anchor with correct kinship structure.
 *
 * Never draws an inaccurate direct line for an indirect relationship: cousins
 * route through parent → aunt/uncle, nieces/nephews through a sibling,
 * grandparents through a parent, etc.
 */
export function buildRelationshipWithPlaceholders(params: {
  intent: AddRelationshipIntent;
  existingNodes: KinshipNode[];
  existingEdges: RelationshipEdge[];
  familyTreeId: string;
  createdByAccountId?: string;
  /** id generator for the target node when `intent.targetNodeId` is absent. */
  newId?: () => string;
}): BuildResult {
  const { intent, existingNodes, existingEdges, familyTreeId, createdByAccountId } = params;
  const ctx: Ctx = {
    familyTreeId,
    createdByAccountId,
    existing: new Map(existingNodes.map((n) => [n.id, n])),
    created: new Map(),
    edges: existingEdges,
    newEdges: [],
    warnings: [],
  };

  const anchor = intent.anchorNodeId;
  const branch = sideToBranch(intent.side);
  const rel = intent.relationshipToAnchor;

  // Resolve (or create) the real target node.
  const targetId = intent.targetNodeId ?? params.newId?.() ?? `node:${familyTreeId}:${ctx.created.size}`;
  if (!hasNode(ctx, targetId)) {
    const isPet = rel === 'pet';
    ctx.created.set(targetId, {
      id: targetId,
      familyTreeId,
      displayName: intent.targetDisplayName,
      nodeType: isPet ? 'pet' : 'person',
      status: isPet ? 'managed' : 'placeholder',
      branchType: undefined,
      visibility: 'family_tree',
      metadata: { roleLabel: roleLabelFor(rel) },
    });
  }
  const setBranch = (b: BranchType) => {
    const n = ctx.created.get(targetId);
    if (n && n.branchType === undefined) n.branchType = b;
  };

  switch (rel) {
    case 'father':
      addEdge(ctx, 'parent_child', targetId, anchor, { fromRole: 'father', toRole: 'child' });
      setBranch('father_side');
      break;
    case 'mother':
      addEdge(ctx, 'parent_child', targetId, anchor, { fromRole: 'mother', toRole: 'child' });
      setBranch('mother_side');
      break;
    case 'parent':
      addEdge(ctx, 'parent_child', targetId, anchor, { fromRole: 'parent', toRole: 'child' });
      setBranch(branch);
      break;
    case 'partner':
      addEdge(ctx, 'partnership', anchor, targetId, { fromRole: 'partner', toRole: 'partner' });
      setBranch('partner_side');
      break;
    case 'child':
      addEdge(ctx, 'parent_child', anchor, targetId, { fromRole: 'parent', toRole: 'child' });
      setBranch('self');
      break;
    case 'sibling': {
      const parentId = ensureParent(ctx, anchor, branch);
      addEdge(ctx, 'parent_child', parentId, targetId, { status: 'inferred', fromRole: 'parent', toRole: 'child' });
      addEdge(ctx, 'sibling', anchor, targetId, {});
      setBranch('self');
      break;
    }
    case 'grandparent': {
      const parentId = ensureParent(ctx, anchor, branch);
      addEdge(ctx, 'parent_child', targetId, parentId, { status: 'inferred', fromRole: 'parent', toRole: 'child' });
      setBranch(branch);
      break;
    }
    case 'grandchild': {
      const childId = ensureChild(ctx, anchor);
      addEdge(ctx, 'parent_child', childId, targetId, { status: 'inferred', fromRole: 'parent', toRole: 'child' });
      setBranch('self');
      break;
    }
    case 'aunt_uncle': {
      const parentId = ensureParent(ctx, anchor, branch);
      addEdge(ctx, 'sibling', parentId, targetId, { status: 'inferred' });
      setBranch(branch);
      break;
    }
    case 'cousin': {
      const parentId = ensureParent(ctx, anchor, branch);
      const auntId = ensureAuntUncle(ctx, parentId, branch);
      addEdge(ctx, 'parent_child', auntId, targetId, { status: 'inferred', fromRole: 'parent', toRole: 'child' });
      setBranch(branch);
      break;
    }
    case 'niece_nephew': {
      const siblingId = ensureSibling(ctx, anchor);
      addEdge(ctx, 'parent_child', siblingId, targetId, { status: 'inferred', fromRole: 'parent', toRole: 'child' });
      setBranch('self');
      break;
    }
    case 'pet':
      addEdge(ctx, 'pet_owner', anchor, targetId, { fromRole: 'owner', toRole: 'pet' });
      setBranch('pet_companion');
      break;
  }

  return {
    nodesToCreate: [...ctx.created.values()],
    edgesToCreate: ctx.newEdges,
    warnings: ctx.warnings,
  };
}

function roleLabelFor(rel: RelationshipToAnchor): string {
  switch (rel) {
    case 'father':
      return 'Father';
    case 'mother':
      return 'Mother';
    case 'parent':
      return 'Parent';
    case 'grandparent':
      return 'Grandparent';
    case 'sibling':
      return 'Sibling';
    case 'aunt_uncle':
      return 'Aunt or Uncle';
    case 'cousin':
      return 'Cousin';
    case 'child':
      return 'Child';
    case 'grandchild':
      return 'Grandchild';
    case 'niece_nephew':
      return 'Niece or Nephew';
    case 'partner':
      return 'Partner';
    case 'pet':
      return 'Pet';
  }
}
