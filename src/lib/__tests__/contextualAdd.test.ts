import { describe, expect, it } from 'vitest';
import type { Relationship } from '@/types/models';
import {
  composeContextualRelationship,
  inferContextualRelationships,
} from '@/lib/contextualAdd';

function rel(
  from: string,
  to: string,
  type: Relationship['relationshipType'],
  id?: string,
): Relationship {
  return {
    id: id ?? `${from}-${to}-${type}`,
    familyTreeId: 'tree1',
    fromNodeId: from,
    toNodeId: to,
    relationshipType: type,
    status: 'approved',
    visibility: 'family_tree',
    createdByAccountId: 'acct1',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };
}

describe('composeContextualRelationship', () => {
  it('maps parent + sibling to aunt/uncle', () => {
    expect(composeContextualRelationship('parent', 'sibling')).toBe('aunt_uncle');
  });

  it('maps spouse + sibling to aunt/uncle (in-law)', () => {
    expect(composeContextualRelationship('spouse', 'sibling')).toBe('aunt_uncle');
  });

  it('maps spouse + parent to parent-in-law, not biological parent', () => {
    expect(composeContextualRelationship('spouse', 'parent')).toBe('parent_in_law');
  });

  it('maps spouse + parent_in_law to parent-in-law for the partner', () => {
    expect(composeContextualRelationship('spouse', 'parent_in_law')).toBe('parent_in_law');
  });
});

describe('inferContextualRelationships', () => {
  it('links a fathers sibling to anchor, grandparents, and mother', () => {
    const relationships = [
      rel('you', 'father', 'parent'),
      rel('father', 'grandpa', 'parent'),
      rel('father', 'mother', 'spouse'),
    ];

    const inferred = inferContextualRelationships({
      contextNodeId: 'father',
      newNodeId: 'aunt',
      relationshipToContext: 'sibling',
      relationships: [...relationships, rel('father', 'aunt', 'sibling')],
    });

    expect(inferred).toEqual(
      expect.arrayContaining([
        { fromNodeId: 'you', toNodeId: 'aunt', relationshipType: 'aunt_uncle' },
        { fromNodeId: 'grandpa', toNodeId: 'aunt', relationshipType: 'child' },
        { fromNodeId: 'mother', toNodeId: 'aunt', relationshipType: 'aunt_uncle' },
      ]),
    );
  });
});
