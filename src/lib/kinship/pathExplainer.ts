import type { BranchType, KinshipNode, RelationshipEdge } from './types';

interface ExplainParams {
  anchorNodeId: string;
  targetNodeId: string;
  path: string[];
  nodes: KinshipNode[];
  edges: RelationshipEdge[];
  /** When false, the anchor node gets no "You" label (viewing from someone else's perspective). */
  labelAnchorAsYou?: boolean;
}

function deltaAlong(edge: RelationshipEdge, from: string, to: string): number {
  switch (edge.type) {
    case 'parent_child':
      return to === edge.fromNodeId ? 1 : -1;
    case 'pet_owner':
      return to === edge.toNodeId ? -0.5 : 0.5;
    default:
      return 0;
  }
}

function edgeBetween(edges: RelationshipEdge[], a: string, b: string): RelationshipEdge | undefined {
  const matches = edges
    .filter((e) => (e.fromNodeId === a && e.toNodeId === b) || (e.fromNodeId === b && e.toNodeId === a))
    .sort((x, y) => x.id.localeCompare(y.id));
  return matches[0];
}

function genFromPath(path: string[], edges: RelationshipEdge[]): number {
  let gen = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const e = edgeBetween(edges, path[i], path[i + 1]);
    if (e) gen += deltaAlong(e, path[i], path[i + 1]);
  }
  return gen;
}

function branchFromPath(
  path: string[],
  edges: RelationshipEdge[],
  byId: Map<string, KinshipNode>,
): BranchType {
  if (path.length < 2) return 'self';
  const anchor = path[0];
  const firstHop = path[1];
  const edge = edgeBetween(edges, anchor, firstHop);
  if (!edge) return 'unsorted';
  if (edge.type === 'parent_child') {
    if (edge.toNodeId === anchor) {
      if (edge.fromRole === 'mother') return 'mother_side';
      if (edge.fromRole === 'father') return 'father_side';
      return byId.get(firstHop)?.branchType ?? 'unsorted';
    }
    return 'self';
  }
  if (edge.type === 'partnership') return 'partner_side';
  if (edge.type === 'sibling') return 'self';
  if (edge.type === 'pet_owner') return 'pet_companion';
  if (edge.type === 'friend' || edge.type === 'chosen_family') return 'chosen_family';
  return 'self';
}

function sidePhrase(branch: BranchType): string {
  if (branch === 'mother_side') return 'your mother’s side';
  if (branch === 'father_side') return 'your father’s side';
  if (branch === 'partner_side') return 'your partner’s side';
  return '';
}

function maternalPaternal(branch: BranchType): string {
  if (branch === 'mother_side') return 'maternal';
  if (branch === 'father_side') return 'paternal';
  return '';
}

function isNamed(node?: KinshipNode): boolean {
  return !!node && node.status !== 'placeholder' && node.nodeType !== 'placeholder';
}

function parentRoleLabel(edge: RelationshipEdge, parentId: string): string {
  if (edge.fromNodeId !== parentId) return 'Parent';
  if (edge.fromRole === 'father') return 'Father';
  if (edge.fromRole === 'mother') return 'Mother';
  if (edge.fromRole === 'step_parent') return 'Step-parent';
  return 'Parent';
}

function childRoleLabelFromEdge(edge: RelationshipEdge, targetId: string, edges: RelationshipEdge[]): string {
  if (edge.fromRole === 'mother') return 'Daughter';
  if (edge.fromRole === 'father') return 'Child';

  const asParent = edges.find((e) => e.type === 'parent_child' && e.fromNodeId === targetId);
  if (asParent?.fromRole === 'father') return 'Son';
  if (asParent?.fromRole === 'mother') return 'Daughter';
  return 'Child';
}

function childRoleLabel(targetId: string, edges: RelationshipEdge[]): string {
  const asChild = edges.find((e) => e.type === 'parent_child' && e.toNodeId === targetId);
  if (asChild) return childRoleLabelFromEdge(asChild, targetId, edges);
  return 'Child';
}

function inLawLabel(childId: string, edges: RelationshipEdge[]): string {
  const childAsParent = edges.find((e) => e.type === 'parent_child' && e.fromNodeId === childId);
  if (childAsParent?.fromRole === 'father') return 'Daughter-in-law';
  if (childAsParent?.fromRole === 'mother') return 'Son-in-law';
  return "Child's partner";
}

/**
 * Labels relative to the selected view anchor using the kinship path.
 * Used when metadata.roleLabel still reflects the signed-in user's perspective.
 */
function labelFromKinshipPath(params: ExplainParams): string {
  const { targetNodeId, path, nodes, edges } = params;
  if (path.length < 2) return 'Family member';

  const anchorId = path[0];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const target = byId.get(targetNodeId);
  if (!target) return 'Family member';

  if (path.length === 2) {
    const e = edgeBetween(edges, path[0], path[1]);
    if (!e) return 'Family member';

    if (e.type === 'partnership') return 'Spouse';
    if (e.type === 'sibling') return 'Sibling';
    if (e.type === 'pet_owner') return 'Family pet';
    if (e.type === 'parent_child') {
      if (e.fromNodeId === anchorId && e.toNodeId === targetNodeId) {
        return childRoleLabelFromEdge(e, targetNodeId, edges);
      }
      if (e.toNodeId === anchorId && e.fromNodeId === targetNodeId) {
        return parentRoleLabel(e, targetNodeId);
      }
    }
  }

  if (path.length === 3) {
    const e1 = edgeBetween(edges, path[0], path[1]);
    const e2 = edgeBetween(edges, path[1], path[2]);
    if (e1 && e2) {
      if (
        e1.type === 'parent_child' &&
        e1.fromNodeId === anchorId &&
        e1.toNodeId === path[1] &&
        e2.type === 'partnership' &&
        path[2] === targetNodeId
      ) {
        return inLawLabel(path[1], edges);
      }
      if (
        e1.type === 'parent_child' &&
        e1.fromNodeId === anchorId &&
        e2.type === 'parent_child' &&
        e2.fromNodeId === path[1] &&
        e2.toNodeId === targetNodeId
      ) {
        return 'Grandchild';
      }
      if (
        e1.type === 'parent_child' &&
        e1.toNodeId === anchorId &&
        e2.type === 'parent_child' &&
        e2.toNodeId === path[1] &&
        e2.fromNodeId === targetNodeId
      ) {
        const branch = target.branchType ?? branchFromPath(path, edges, byId);
        const mp = maternalPaternal(branch);
        return mp ? `${cap(mp)} grandparent` : 'Grandparent';
      }
    }
  }

  const gen = genFromPath(path, edges);
  const branch = target.branchType ?? branchFromPath(path, edges, byId);
  const mp = maternalPaternal(branch);

  if (gen === 1) {
    const e = edgeBetween(edges, path[path.length - 2], path[path.length - 1]);
    if (e?.type === 'parent_child') return parentRoleLabel(e, targetNodeId);
    return 'Parent';
  }
  if (gen === 2) return mp ? `${cap(mp)} grandparent` : 'Grandparent';
  if (gen === -1) return childRoleLabel(targetNodeId, edges);
  if (gen === -2) return 'Grandchild';
  if (gen === 0) return 'Relative';
  return 'Family member';
}

/** Short relationship label, e.g. "Maternal grandmother", "Cousin on your father’s side". */
export function getRelationshipLabel(params: ExplainParams): string {
  const { anchorNodeId, targetNodeId, path, nodes, edges, labelAnchorAsYou = true } = params;
  if (targetNodeId === anchorNodeId) return labelAnchorAsYou ? 'You' : '';
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const target = byId.get(targetNodeId);
  if (!target) return 'Family member';

  if (!labelAnchorAsYou) {
    return labelFromKinshipPath(params);
  }

  const role = (target.metadata?.roleLabel as string | undefined) ?? '';
  const gen = genFromPath(path, edges);
  const branch = target.branchType ?? branchFromPath(path, edges, byId);
  const mp = maternalPaternal(branch);
  const side = sidePhrase(branch);

  switch (role) {
    case 'Father':
      return 'Father';
    case 'Mother':
      return 'Mother';
    case 'Parent':
      return 'Parent';
    case 'Step-parent':
      return 'Step-parent';
    case 'Parent-in-law':
      return 'Parent-in-law';
    case 'Grandparent':
      return mp ? `${cap(mp)} grandparent` : 'Grandparent';
    case 'Aunt or Uncle':
      return side ? `Aunt or uncle on ${side}` : 'Aunt or uncle';
    case 'Cousin':
      return side ? `Cousin on ${side}` : 'Cousin';
    case 'Sibling':
      return 'Sibling';
    case 'Partner':
      return 'Partner';
    case 'Child':
      return 'Child';
    case 'Grandchild':
      return 'Grandchild';
    case 'Niece or Nephew':
      return 'Niece or nephew';
    case 'Pet':
      return 'Family pet';
  }

  // Fallback purely from generation offset.
  if (gen === 1) return 'Parent';
  if (gen === 2) return 'Grandparent';
  if (gen === -1) return 'Child';
  if (gen === -2) return 'Grandchild';
  if (gen === 0) return 'Relative';
  return 'Family member';
}

/** A warm, full-sentence explanation of how the target connects to the anchor. */
export function getRelationshipExplanation(params: ExplainParams): string {
  const { anchorNodeId, targetNodeId, path, nodes, edges } = params;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const target = byId.get(targetNodeId);
  if (!target) return '';
  const name = target.displayName;
  if (targetNodeId === anchorNodeId) return 'This is you.';

  const role = (target.metadata?.roleLabel as string | undefined) ?? '';
  const branch = target.branchType ?? branchFromPath(path, edges, byId);
  const side = sidePhrase(branch);
  const mp = maternalPaternal(branch);

  switch (role) {
    case 'Father':
      return `${name} is your father.`;
    case 'Mother':
      return `${name} is your mother.`;
    case 'Parent':
      return `${name} is your parent.`;
    case 'Step-parent':
      return `${name} is your step-parent.`;
    case 'Parent-in-law':
      return `${name} is your parent-in-law.`;
    case 'Grandparent':
      return mp ? `${name} is your ${mp} grandparent.` : `${name} is your grandparent.`;
    case 'Aunt or Uncle':
      return side ? `${name} is your aunt or uncle through ${side}.` : `${name} is your aunt or uncle.`;
    case 'Cousin': {
      const through = throughRelativeName(path, byId, 2);
      if (through) return `${name} is your cousin through ${through}.`;
      return side ? `${name} is your cousin through ${side}.` : `${name} is your cousin.`;
    }
    case 'Sibling':
      return `${name} is your sibling.`;
    case 'Partner':
      return `${name} is your partner.`;
    case 'Child':
      return `${name} is your child.`;
    case 'Grandchild':
      return `${name} is your grandchild.`;
    case 'Niece or Nephew': {
      const through = throughRelativeName(path, byId, 1);
      return through
        ? `${name} is your niece or nephew through your sibling, ${through}.`
        : `${name} is your niece or nephew through your sibling.`;
    }
    case 'Pet': {
      const owners = petOwnerNames(targetNodeId, edges, byId);
      if (owners.length > 1) return `${name} is a family pet, cared for by ${joinNames(owners)}.`;
      if (owners.length === 1) return `${name} is a family pet, cared for by ${owners[0]}.`;
      return `${name} is connected as a family pet.`;
    }
  }
  return `${name} is part of your Family Tree.`;
}

/** The named relative at a given index in the path, if not a placeholder. */
function throughRelativeName(path: string[], byId: Map<string, KinshipNode>, index: number): string | undefined {
  const node = byId.get(path[index]);
  return isNamed(node) ? node!.displayName : undefined;
}

function petOwnerNames(petId: string, edges: RelationshipEdge[], byId: Map<string, KinshipNode>): string[] {
  return edges
    .filter((e) => e.type === 'pet_owner' && e.toNodeId === petId)
    .map((e) => byId.get(e.fromNodeId))
    .filter((n): n is KinshipNode => isNamed(n))
    .map((n) => n.displayName)
    .sort((a, b) => a.localeCompare(b));
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
