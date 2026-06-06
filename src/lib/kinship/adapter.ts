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
  if (s === 'archived' || s === 'vacated') return 'managed';
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

function hasEdge(edges: RelationshipEdge[], id: string): boolean {
  return edges.some((e) => e.id === id);
}

/**
 * Expand one stored relationship edge into TKE edges + optional placeholders.
 *
 * App edges are authored from the source node's perspective (Connections Editor
 * and add-relative both set `from_node_id` to the editor / anchor node):
 * "[to] is [from]'s {relationshipType}".
 */
function applyStoredRelationship(params: {
  rel: Relationship;
  appNodes: FamilyNode[];
  existingNodes: KinshipNode[];
  existingEdges: RelationshipEdge[];
  placeholders: KinshipNode[];
  familyTreeId: string;
}): void {
  const { rel, appNodes, existingNodes, existingEdges, placeholders, familyTreeId } = params;
  const sourceId = rel.fromNodeId;
  const targetId = rel.toNodeId;
  const source = appNodes.find((n) => n.id === sourceId);
  const target = appNodes.find((n) => n.id === targetId);
  if (!source || !target) return;

  const intent = toIntent(rel.relationshipType);
  if (intent === null) {
    const id = `edge:chosen_family:${sourceId}->${targetId}`;
    if (!hasEdge(existingEdges, id)) {
      existingEdges.push({
        id,
        familyTreeId,
        fromNodeId: sourceId,
        toNodeId: targetId,
        type: 'chosen_family',
        status: 'confirmed',
        visibility: mapVisibility(rel.visibility),
        createdByAccountId: rel.createdByAccountId,
      });
    }
    return;
  }

  if (intent === 'friend' || intent === 'chosen_family') {
    const id = `edge:${intent}:${sourceId}->${targetId}`;
    if (!hasEdge(existingEdges, id)) {
      existingEdges.push({
        id,
        familyTreeId,
        fromNodeId: sourceId,
        toNodeId: targetId,
        type: intent,
        status: 'confirmed',
        visibility: mapVisibility(rel.visibility),
        createdByAccountId: rel.createdByAccountId,
      });
    }
    return;
  }

  const result = buildRelationshipWithPlaceholders({
    intent: {
      anchorNodeId: sourceId,
      targetDisplayName: target.displayName,
      relationshipToAnchor: intent,
      side: 'unsorted',
      targetNodeId: targetId,
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
  for (const e of result.edgesToCreate) {
    if (!hasEdge(existingEdges, e.id)) existingEdges.push(e);
  }
}

/**
 * Convert the app's stored Family Tree into a normalized kinship graph.
 *
 * Every persisted relationship is interpreted from its `from_node_id` (the node
 * whose profile authored the link). That includes lateral links — e.g. a spouse
 * connection between two parents — not only edges that touch the viewer.
 *
 * Indirect types (cousin, grandparent, …) are expanded with ephemeral
 * placeholder bridge nodes per the Tomora Kinship Engine.
 */
export function buildKinshipGraphFromApp(params: {
  nodes: FamilyNode[];
  relationships: Relationship[];
  anchorNodeId: string;
}): KinshipGraphData {
  const { nodes: appNodes, relationships, anchorNodeId } = params;
  const familyTreeId = appNodes[0]?.familyTreeId ?? 'tree';
  const nodeIds = new Set(appNodes.map((n) => n.id));

  const petIds = new Set<string>();
  for (const r of relationships) {
    if (r.relationshipType === 'pet' && nodeIds.has(r.fromNodeId) && nodeIds.has(r.toNodeId)) {
      petIds.add(r.toNodeId);
    }
    if (r.relationshipType === 'caretaker' && nodeIds.has(r.fromNodeId) && nodeIds.has(r.toNodeId)) {
      petIds.add(r.fromNodeId);
    }
  }

  const roleByNode = new Map<string, RelationshipType>();
  for (const r of relationships) {
    if (r.fromNodeId === anchorNodeId) roleByNode.set(r.toNodeId, r.relationshipType);
    else if (r.toNodeId === anchorNodeId) roleByNode.set(r.fromNodeId, r.relationshipType);
  }

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
      metadata: {
        ...(role ? { roleLabel: roleLabelFor(role) } : null),
        tags: n.tags ?? [],
        isLiving: n.isLiving !== false,
        avatarUrl: n.profile?.profilePhoto?.value ?? n.avatarUrl,
      },
    };
  });

  const existingNodes: KinshipNode[] = [...baseNodes];
  const existingEdges: RelationshipEdge[] = [];
  const placeholders: KinshipNode[] = [];

  const storedRels = relationships
    .filter((r) => nodeIds.has(r.fromNodeId) && nodeIds.has(r.toNodeId))
    .sort((a, b) => a.id.localeCompare(b.id));

  for (const rel of storedRels) {
    applyStoredRelationship({
      rel,
      appNodes,
      existingNodes,
      existingEdges,
      placeholders,
      familyTreeId,
    });
  }

  return { nodes: [...baseNodes, ...placeholders], edges: existingEdges };
}
