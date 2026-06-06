import { describe, expect, it } from 'vitest';
import type { FamilyNode, Relationship } from '@/types/models';
import { buildKinshipGraphFromApp } from '../adapter';

function node(id: string, name: string, overrides: Partial<FamilyNode> = {}): FamilyNode {
  return {
    id,
    familyTreeId: 'tree1',
    displayName: name,
    status: 'placeholder',
    isLiving: true,
    defaultVisibility: 'family_tree',
    profile: {},
    tags: [],
    alternateNames: [],
    memorialPrivacy: 'family',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  };
}

function rel(
  id: string,
  from: string,
  to: string,
  relationshipType: Relationship['relationshipType'],
): Relationship {
  return {
    id,
    familyTreeId: 'tree1',
    fromNodeId: from,
    toNodeId: to,
    relationshipType,
    status: 'approved',
    visibility: 'family_tree',
    createdByAccountId: 'acct1',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };
}

describe('buildKinshipGraphFromApp', () => {
  it('renders a partnership between two parents linked from the mother profile', () => {
    const self = node('self', 'You', { status: 'claimed', ownerAccountId: 'acct1' });
    const mother = node('mother', 'Maria');
    const father = node('father', 'Jose');

    const graph = buildKinshipGraphFromApp({
      anchorNodeId: 'self',
      nodes: [self, mother, father],
      relationships: [
        rel('r1', 'self', 'mother', 'parent'),
        rel('r2', 'self', 'father', 'parent'),
        rel('r3', 'mother', 'father', 'spouse'),
      ],
    });

    const partnership = graph.edges.find((e) => e.type === 'partnership');
    expect(partnership).toBeDefined();
    expect([partnership!.fromNodeId, partnership!.toNodeId].sort()).toEqual(['father', 'mother']);
  });

  it('interprets stored edges from the source node perspective', () => {
    const self = node('self', 'You', { status: 'claimed', ownerAccountId: 'acct1' });
    const mother = node('mother', 'Maria');

    const graph = buildKinshipGraphFromApp({
      anchorNodeId: 'self',
      nodes: [self, mother],
      relationships: [rel('r1', 'mother', 'self', 'child')],
    });

    const parentChild = graph.edges.find((e) => e.type === 'parent_child');
    expect(parentChild).toBeDefined();
    expect(parentChild!.fromNodeId).toBe('mother');
    expect(parentChild!.toNodeId).toBe('self');
  });

  it('tags step-parent and parent-in-law edges with distinct lineage roles', () => {
    const self = node('self', 'You', { status: 'claimed', ownerAccountId: 'acct1' });
    const bio = node('mom', 'Maria');
    const step = node('step', 'Helen');
    const inLaw = node('mil', 'Rosa');

    const graph = buildKinshipGraphFromApp({
      anchorNodeId: 'self',
      nodes: [self, bio, step, inLaw],
      relationships: [
        rel('r1', 'self', 'mom', 'parent'),
        rel('r2', 'self', 'step', 'step_parent'),
        rel('r3', 'self', 'mil', 'parent_in_law'),
      ],
    });

    const bioEdge = graph.edges.find((e) => e.fromNodeId === 'mom' && e.toNodeId === 'self');
    const stepEdge = graph.edges.find((e) => e.fromNodeId === 'step' && e.toNodeId === 'self');
    const inLawEdge = graph.edges.find((e) => e.fromNodeId === 'mil' && e.toNodeId === 'self');

    expect(bioEdge?.fromRole).toBe('parent');
    expect(stepEdge?.fromRole).toBe('step_parent');
    expect(inLawEdge?.fromRole).toBe('parent_in_law');
  });
});
