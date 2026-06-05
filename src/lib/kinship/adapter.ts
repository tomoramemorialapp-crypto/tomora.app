import type {
  FamilyNode,
  Relationship,
  RelationshipType,
  NodeStatus as AppNodeStatus,
  VisibilityLevel as AppVisibility,
} from '@/types/models';
import { buildRelationshipWithPlaceholders, type RelationshipToAnchor } from './placeholders';
import type {
  KinshipNode,
  NodeStatus,
  NodeType,
  RelationshipEdge,
  VisibilityLevel,
} from './types';

function mapStatus(s: AppNodeStatus): NodeStatus {
  if (s === 'archived') return 'managed';
  return s;
}

function mapVisibility(v: AppVisibility): VisibilityLevel {
  switch (v) {
    case 'private':
      return 'private';
    case 'selected_people':
      return 'selected';
    case 'family_tree':
      return 'family_tree';
    case 'invite_link':
      return 'semi_private';
    case 'public':
      return 'public';
    default:
      return 'family_tree';
  }
}

function nodeTypeFor(node: FamilyNode, isPet: boolean): NodeType {
  if (isPet) return 'pet';
  if (node.isLiving === false || node.status === 'memory_light' || node.status === 'memorial_pending') {
    return 'deceased';
  }
  return 'person';
}

/** Map an app relationship type (relative's role to anchor) to an engine intent. */
function toIntent(type: RelationshipType): RelationshipToAnchor | 'friend' | 'chosen_family' | null {
  switch (type) {
    case 'parent':
      return 'parent';
    case 'child':
      return 'child';
    case 'sibling':
      return 'sibling';
    case 'grandparent':
      return 'grandparent';
    case 'grandchild':
      return 'grandchild';
    case 'aunt_uncle':
      return 'aunt_uncle';
    case 'niece_nephew':
      return 'niece_nephew';
    case 'cousin':
      return 'cousin';
    case 'spouse':
    case 'partner':
      return 'partner';
    case 'pet':
      return 'pet';
    case 'friend':
      return 'friend';
    case 'chosen_family':
      return 'chosen_family';
    case 'caretaker':
    case 'other':
    case 'self':
      return null;
  }
}

function roleLabelFor(type: RelationshipType): string {
  const map: Partial<Record<RelationshipType, string>> = {
    parent: 'Parent',
    child: 'Child',
    sibling: 'Sibling',
    grandparent: 'Grandparent',
    grandchild: 'Grandchild',
    aunt_uncle: 'Aunt or Uncle',
    niece_nephew: 'Niece or Nephew',
    cousin: 'Cousin',
    spouse: 'Partner',
    partner: 'Partner',
    pet: 'Pet',
    friend: 'Friend',
    chosen_family: 'Chosen family',
    caretaker: 'Caretaker',
  };
  return map[type] ?? 'Family member';
}

export interface KinshipGraphData {
  nodes: KinshipNode[];
  edges: RelationshipEdge[];
}

/**
 * Convert the app's stored Family Tree (anchor-centric relationships typed by
 * the relative's role) into a normalized kinship graph. Indirect relationships
 * (grandparent, aunt/uncle, cousin, niece/nephew, grandchild) are expanded with
 * ephemeral placeholder bridge nodes so the engine can render accurate paths.
 *
 * Side (maternal/paternal) defaults to "unsorted" because the current schema
 * does not persist it; bridges on the same side are shared/deduped.
 */
export function buildKinshipGraphFromApp(params: {
  nodes: FamilyNode[];
  relationships: Relationship[];
  anchorNodeId: string;
}): KinshipGraphData {
  const { nodes: appNodes, relationships, anchorNodeId } = params;
  const familyTreeId = appNodes[0]?.familyTreeId ?? 'tree';

  const petIds = new Set<string>();
  for (const r of relationships) {
    if (r.relationshipType === 'pet') {
      if (r.fromNodeId === anchorNodeId) petIds.add(r.toNodeId);
      else if (r.toNodeId === anchorNodeId) petIds.add(r.fromNodeId);
    }
  }

  const roleByNode = new Map<string, RelationshipType>();
  for (const r of relationships) {
    if (r.fromNodeId === anchorNodeId) roleByNode.set(r.toNodeId, r.relationshipType);
    else if (r.toNodeId === anchorNodeId) roleByNode.set(r.fromNodeId, r.relationshipType);
  }

  // Base kinship nodes for every real app node.
  const baseNodes: KinshipNode[] = appNodes.map((n) => {
    const role = roleByNode.get(n.id);
    return {
      id: n.id,
      familyTreeId: n.familyTreeId,
      accountId: n.ownerAccountId,
      displayName: n.displayName,
      nodeType: nodeTypeFor(n, petIds.has(n.id)),
      status: mapStatus(n.status),
      birthDate: n.birthDate,
      deathDate: n.deathDate,
      isAnchor: n.id === anchorNodeId,
      visibility: mapVisibility(n.defaultVisibility),
      metadata: role ? { roleLabel: roleLabelFor(role) } : undefined,
    };
  });

  const existingNodes: KinshipNode[] = [...baseNodes];
  const existingEdges: RelationshipEdge[] = [];
  const placeholders: KinshipNode[] = [];

  // Process anchor-centric relationships deterministically.
  const anchorRels = relationships
    .filter((r) => r.fromNodeId === anchorNodeId || r.toNodeId === anchorNodeId)
    .sort((a, b) => a.id.localeCompare(b.id));

  for (const rel of anchorRels) {
    const relativeId = rel.fromNodeId === anchorNodeId ? rel.toNodeId : rel.fromNodeId;
    const relative = appNodes.find((n) => n.id === relativeId);
    if (!relative) continue;
    const intent = toIntent(rel.relationshipType);
    if (intent === null) {
      // caretaker/other → quiet same-generation chosen connection
      existingEdges.push({
        id: `edge:chosen_family:${anchorNodeId}->${relativeId}`,
        familyTreeId,
        fromNodeId: anchorNodeId,
        toNodeId: relativeId,
        type: 'chosen_family',
        status: 'confirmed',
        visibility: mapVisibility(rel.visibility),
      });
      continue;
    }
    if (intent === 'friend' || intent === 'chosen_family') {
      existingEdges.push({
        id: `edge:${intent}:${anchorNodeId}->${relativeId}`,
        familyTreeId,
        fromNodeId: anchorNodeId,
        toNodeId: relativeId,
        type: intent,
        status: 'confirmed',
        visibility: mapVisibility(rel.visibility),
      });
      continue;
    }

    const result = buildRelationshipWithPlaceholders({
      intent: {
        anchorNodeId,
        targetDisplayName: relative.displayName,
        relationshipToAnchor: intent,
        side: 'unsorted',
        targetNodeId: relativeId,
      },
      existingNodes,
      existingEdges,
      familyTreeId,
      createdByAccountId: rel.createdByAccountId,
    });

    for (const ph of result.nodesToCreate) {
      if (!existingNodes.some((n) => n.id === ph.id)) {
        existingNodes.push(ph);
        placeholders.push(ph);
      }
    }
    for (const e of result.edgesToCreate) existingEdges.push(e);
  }

  return { nodes: [...baseNodes, ...placeholders], edges: existingEdges };
}
