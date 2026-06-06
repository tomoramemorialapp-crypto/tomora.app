import { describe, expect, it } from 'vitest';
import { getLineStyle } from '@/lib/kinship/edgeRouter';
import { lineStyleForParentLineage } from '@/lib/parentLineage';
import type { RelationshipEdge } from '@/lib/kinship/types';

function parentEdge(fromRole: string): RelationshipEdge {
  return {
    id: 'e1',
    familyTreeId: 't1',
    fromNodeId: 'p1',
    toNodeId: 'c1',
    type: 'parent_child',
    status: 'confirmed',
    visibility: 'family_tree',
    fromRole,
    toRole: 'child',
  };
}

describe('parent lineage line styles', () => {
  it('uses solid lines for biological parents', () => {
    expect(getLineStyle(parentEdge('parent'))).toBe('solid');
    expect(getLineStyle(parentEdge('mother'))).toBe('solid');
  });

  it('uses dashed lines for step-parents', () => {
    expect(lineStyleForParentLineage('step')).toBe('dashed');
    expect(getLineStyle(parentEdge('step_parent'))).toBe('dashed');
  });

  it('uses dotted lines for parents-in-law', () => {
    expect(lineStyleForParentLineage('in_law')).toBe('dotted');
    expect(getLineStyle(parentEdge('parent_in_law'))).toBe('dotted');
  });
});
