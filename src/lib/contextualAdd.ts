/**
 * Contextual "add relative" — add someone relative to a selected tree node and
 * infer additional relationship edges to other family members already in the tree.
 *
 * Stored edges are authored from the source node's perspective: "[to] is [from]'s
 * {relationshipType}".
 */

import type { FamilyNode, Relationship, RelationshipType } from '@/types/models';
import { INVERSE_RELATIONSHIP_TYPE } from '@/lib/relationshipDetail';
import { getContextRelationshipChoices } from '@/lib/relationshipTaxonomy';
import { relationshipLabel, relationshipPath } from '@/lib/relationshipUtils';

export const INVERSE_RELATIONSHIP = INVERSE_RELATIONSHIP_TYPE;

/** Choices when adding relative to someone other than the anchor user. */
export const contextRelationshipChoices = getContextRelationshipChoices();

/**
 * If context is neighbor's `neighborToContext` and new person is context's
 * `contextToNew`, return what new person is to neighbor — or null when unknown.
 */
export function composeContextualRelationship(
  neighborToContext: RelationshipType,
  contextToNew: RelationshipType,
): RelationshipType | null {
  const table: Partial<Record<RelationshipType, Partial<Record<RelationshipType, RelationshipType | null>>>> = {
    parent: {
      sibling: 'aunt_uncle',
      child: 'sibling',
      parent: 'grandparent',
      grandparent: 'grandparent',
      spouse: 'parent',
      partner: 'parent',
      step_parent: 'parent',
      aunt_uncle: 'grandparent',
      niece_nephew: 'cousin',
      cousin: 'aunt_uncle',
      grandchild: 'parent',
    },
    step_parent: {
      sibling: 'aunt_uncle',
      child: 'sibling',
      parent: 'grandparent',
      spouse: 'step_parent',
      partner: 'step_parent',
    },
    child: {
      sibling: 'child',
      child: 'grandchild',
      parent: 'self',
      grandparent: 'parent',
      spouse: 'child',
      partner: 'child',
      niece_nephew: 'grandchild',
      aunt_uncle: 'cousin',
      cousin: 'child',
    },
    child_in_law: {
      parent: 'parent_in_law',
      parent_in_law: 'parent_in_law',
      child: 'child_in_law',
      spouse: 'child_in_law',
      partner: 'child_in_law',
      sibling: 'child_in_law',
    },
    sibling: {
      sibling: 'sibling',
      parent: 'parent',
      child: 'niece_nephew',
      grandparent: 'aunt_uncle',
      aunt_uncle: 'parent',
      niece_nephew: 'child',
      cousin: 'sibling',
      spouse: 'sibling',
      partner: 'sibling',
    },
    spouse: {
      sibling: 'aunt_uncle',
      parent: 'parent_in_law',
      parent_in_law: 'parent_in_law',
      child: 'child',
      child_in_law: 'child_in_law',
      grandparent: 'parent_in_law',
      aunt_uncle: 'parent_in_law',
      niece_nephew: 'child_in_law',
      spouse: 'self',
      partner: 'self',
    },
    partner: {
      sibling: 'aunt_uncle',
      parent: 'parent_in_law',
      parent_in_law: 'parent_in_law',
      child: 'child',
      child_in_law: 'child_in_law',
      grandparent: 'parent_in_law',
      aunt_uncle: 'parent_in_law',
      niece_nephew: 'child_in_law',
      spouse: 'self',
      partner: 'self',
    },
    parent_in_law: {
      child: 'child_in_law',
      sibling: 'parent_in_law',
      spouse: 'parent_in_law',
      partner: 'parent_in_law',
      parent: 'parent_in_law',
    },
    aunt_uncle: {
      sibling: 'parent',
      child: 'cousin',
      parent: 'grandparent',
      niece_nephew: 'cousin',
      cousin: 'aunt_uncle',
    },
    grandparent: {
      sibling: 'aunt_uncle',
      child: 'parent',
      parent: 'grandparent',
      grandchild: 'child',
      aunt_uncle: 'grandparent',
    },
    grandchild: {
      parent: 'child',
      child: 'grandchild',
      sibling: 'niece_nephew',
      aunt_uncle: 'cousin',
    },
    cousin: {
      sibling: 'cousin',
      parent: 'aunt_uncle',
      child: 'cousin',
      aunt_uncle: 'grandparent',
    },
    niece_nephew: {
      sibling: 'child',
      parent: 'sibling',
      child: 'grandchild',
      aunt_uncle: 'cousin',
      cousin: 'niece_nephew',
    },
    caretaker: {
      sibling: 'caretaker',
      parent: 'caretaker',
      child: 'caretaker',
    },
    pet: {
      sibling: 'pet',
      child: 'pet',
    },
  };

  const row = table[neighborToContext];
  const result = row?.[contextToNew];
  return result === undefined ? null : result;
}

/** How the context node relates to `neighborId` on a single stored edge. */
export function roleOfContextRelativeToNeighbor(
  neighborId: string,
  contextId: string,
  rel: Relationship,
): RelationshipType | null {
  if (rel.fromNodeId === neighborId && rel.toNodeId === contextId) {
    return rel.relationshipType;
  }
  if (rel.fromNodeId === contextId && rel.toNodeId === neighborId) {
    return INVERSE_RELATIONSHIP[rel.relationshipType];
  }
  return null;
}

function edgeKey(from: string, to: string, type: RelationshipType): string {
  return `${from}>${to}:${type}`;
}

function relationshipExists(
  relationships: Relationship[],
  fromNodeId: string,
  toNodeId: string,
  relationshipType: RelationshipType,
): boolean {
  return relationships.some(
    (r) => r.fromNodeId === fromNodeId && r.toNodeId === toNodeId && r.relationshipType === relationshipType,
  );
}

export interface InferredRelationshipEdge {
  fromNodeId: string;
  toNodeId: string;
  relationshipType: RelationshipType;
}

/** Infer extra edges after linking `newNodeId` to `contextNodeId`. */
export function inferContextualRelationships(params: {
  contextNodeId: string;
  newNodeId: string;
  relationshipToContext: RelationshipType;
  relationships: Relationship[];
}): InferredRelationshipEdge[] {
  const { contextNodeId, newNodeId, relationshipToContext, relationships } = params;
  const inferred: InferredRelationshipEdge[] = [];
  const seen = new Set<string>();

  const neighbors = new Set<string>();
  for (const rel of relationships) {
    if (rel.fromNodeId === contextNodeId) neighbors.add(rel.toNodeId);
    if (rel.toNodeId === contextNodeId) neighbors.add(rel.fromNodeId);
  }

  for (const neighborId of neighbors) {
    if (neighborId === newNodeId) continue;

    let best: RelationshipType | null = null;
    for (const rel of relationships) {
      const role = roleOfContextRelativeToNeighbor(neighborId, contextNodeId, rel);
      if (!role) continue;
      const composed = composeContextualRelationship(role, relationshipToContext);
      if (!composed || composed === 'self') continue;
      best = composed;
      break;
    }
    if (!best) continue;

    const key = edgeKey(neighborId, newNodeId, best);
    if (seen.has(key)) continue;
    if (relationshipExists(relationships, neighborId, newNodeId, best)) continue;

    seen.add(key);
    inferred.push({ fromNodeId: neighborId, toNodeId: newNodeId, relationshipType: best });
  }

  return inferred;
}

export interface InferredConnectionPreview {
  nodeId: string;
  nodeName: string;
  relationshipType: RelationshipType;
  label: string;
}

/** Human-readable preview of inferred connections for the add-relative screen. */
export function previewInferredConnections(params: {
  contextNodeId: string;
  relationshipToContext: RelationshipType;
  anchorNodeId: string;
  nodes: FamilyNode[];
  relationships: Relationship[];
}): InferredConnectionPreview[] {
  const { contextNodeId, relationshipToContext, anchorNodeId, nodes, relationships } = params;
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const inferred = inferContextualRelationships({
    contextNodeId,
    newNodeId: '__preview__',
    relationshipToContext,
    relationships,
  });

  return inferred
    .map((edge) => {
      const node = nodeById.get(edge.fromNodeId);
      if (!node) return null;
      const label =
        edge.fromNodeId === anchorNodeId
          ? relationshipPath(edge.relationshipType)
          : `${node.displayName} — ${relationshipLabel(edge.relationshipType)}`;
      return {
        nodeId: edge.fromNodeId,
        nodeName: node.displayName,
        relationshipType: edge.relationshipType,
        label,
      };
    })
    .filter((x): x is InferredConnectionPreview => x !== null);
}
