import { describe, expect, it } from 'vitest';
import { findKnownParents, hasKnownParent, shouldCreatePlaceholderBridge } from '../bridgePolicy';
import type { RelationshipEdge } from '../types';

function parentChild(from: string, to: string): RelationshipEdge {
  return {
    id: `pc:${from}->${to}`,
    familyTreeId: 't',
    fromNodeId: from,
    toNodeId: to,
    type: 'parent_child',
    status: 'confirmed',
    visibility: 'family_tree',
    approvedByNodeIds: [],
  };
}

describe('bridgePolicy', () => {
  it('never bridges direct first-degree relationships', () => {
    expect(
      shouldCreatePlaceholderBridge({
        relationshipToAnchor: 'father',
        anchorNodeId: 'self',
        existingEdges: [],
      }),
    ).toBe(false);
    expect(
      shouldCreatePlaceholderBridge({
        relationshipToAnchor: 'child',
        anchorNodeId: 'self',
        existingEdges: [],
      }),
    ).toBe(false);
  });

  it('skips sibling bridge when parents already exist', () => {
    const edges = [parentChild('dad', 'self'), parentChild('mom', 'self')];
    expect(findKnownParents('self', edges)).toEqual(['dad', 'mom']);
    expect(hasKnownParent('self', edges)).toBe(true);
    expect(
      shouldCreatePlaceholderBridge({
        relationshipToAnchor: 'sibling',
        anchorNodeId: 'self',
        existingEdges: edges,
      }),
    ).toBe(false);
  });

  it('requires sibling bridge when no parents exist', () => {
    expect(
      shouldCreatePlaceholderBridge({
        relationshipToAnchor: 'sibling',
        anchorNodeId: 'self',
        existingEdges: [],
      }),
    ).toBe(true);
  });
});
