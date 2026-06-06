import { describe, expect, it } from 'vitest';

import { pickPrimaryRelationship } from '@/lib/relationshipUtils';
import type { Relationship } from '@/types/models';

const rel = (partial: Partial<Relationship> & Pick<Relationship, 'id' | 'fromNodeId' | 'toNodeId' | 'relationshipType'>): Relationship => ({
  familyTreeId: 'tree-1',
  status: 'approved',
  visibility: 'family_tree',
  createdByAccountId: 'account-1',
  createdAt: '',
  updatedAt: '',
  ...partial,
});

describe('pickPrimaryRelationship', () => {
  const relationships: Relationship[] = [
    rel({ id: 'r1', fromNodeId: 'self', toNodeId: 'mom', relationshipType: 'parent' }),
    rel({ id: 'r2', fromNodeId: 'mom', toNodeId: 'aunt', relationshipType: 'sibling' }),
    rel({ id: 'r3', fromNodeId: 'mom', toNodeId: 'cousin', relationshipType: 'other' }),
  ];

  it('prefers the edge connected to the viewer node', () => {
    expect(pickPrimaryRelationship(relationships, 'mom', 'self')?.relationshipType).toBe('parent');
  });

  it('falls back to the most specific type when viewer is unknown', () => {
    expect(pickPrimaryRelationship(relationships, 'mom')?.relationshipType).toBe('parent');
  });

  it('returns undefined when no edges match', () => {
    expect(pickPrimaryRelationship(relationships, 'missing', 'self')).toBeUndefined();
  });
});
