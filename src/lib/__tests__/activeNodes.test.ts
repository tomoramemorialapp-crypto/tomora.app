import { describe, expect, it } from 'vitest';
import { activeNodes, activeRelationships, isActiveNode } from '../activeNodes';
import type { Relationship } from '@/types/models';
import type { FamilyNode } from '@/types/models';

function node(partial: Partial<FamilyNode> & Pick<FamilyNode, 'id' | 'displayName'>): FamilyNode {
  return {
    familyTreeId: 't',
    status: 'claimed',
    defaultVisibility: 'family_tree',
    profile: {},
    tags: [],
    alternateNames: [],
    memorialPrivacy: 'family',
    createdAt: '',
    updatedAt: '',
    ...partial,
  };
}

describe('activeNodes', () => {
  it('excludes soft-deleted and archived nodes', () => {
    const nodes = [
      node({ id: 'a', displayName: 'You' }),
      node({ id: 'b', displayName: 'Pet', deletedAt: '2026-01-01T00:00:00Z' }),
      node({ id: 'c', displayName: 'Old', status: 'archived' }),
      node({ id: 'd', displayName: 'Gone', status: 'deleted' }),
    ];
    expect(activeNodes(nodes).map((n) => n.id)).toEqual(['a']);
    expect(isActiveNode(nodes[1]!)).toBe(false);
  });

  it('drops relationships touching inactive nodes', () => {
    const nodes = [
      node({ id: 'a', displayName: 'You' }),
      node({ id: 'b', displayName: 'Pet', status: 'deleted' }),
    ];
    const rels: Relationship[] = [
      {
        id: 'r1',
        familyTreeId: 't',
        fromNodeId: 'a',
        toNodeId: 'b',
        relationshipType: 'pet',
        status: 'approved',
        visibility: 'family_tree',
        createdByAccountId: 'u',
        createdAt: '',
        updatedAt: '',
      },
    ];
    expect(activeRelationships(nodes, rels)).toEqual([]);
  });
});
