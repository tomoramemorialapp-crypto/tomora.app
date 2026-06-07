import { describe, expect, it } from 'vitest';

import type { Relationship } from '@/types/models';
import {
  inferSiblingParentEdges,
  needsSiblingBridgePrompt,
  tagsForSiblingBridgeMode,
  UNBRIDGED_SIBLING_TAG,
} from '@/lib/siblingAdd';

function rel(from: string, to: string, type: Relationship['relationshipType']): Relationship {
  return {
    id: `${from}-${to}-${type}`,
    familyTreeId: 't1',
    fromNodeId: from,
    toNodeId: to,
    relationshipType: type,
    status: 'approved',
    visibility: 'family_tree',
    createdByAccountId: 'a1',
    createdAt: '',
    updatedAt: '',
  };
}

describe('siblingAdd', () => {
  it('prompts when child has no parents', () => {
    expect(needsSiblingBridgePrompt('self', [rel('self', 'sis', 'sibling')])).toBe(true);
  });

  it('skips prompt when parents exist', () => {
    const relationships = [rel('self', 'dad', 'parent'), rel('self', 'mom', 'parent')];
    expect(needsSiblingBridgePrompt('self', relationships)).toBe(false);
  });

  it('infers parent edges for each known parent', () => {
    const relationships = [rel('self', 'dad', 'parent'), rel('self', 'mom', 'parent')];
    const edges = inferSiblingParentEdges({ childId: 'self', newSiblingId: 'sis', relationships });
    expect(edges).toHaveLength(2);
    expect(edges).toContainEqual({ fromNodeId: 'sis', toNodeId: 'dad', relationshipType: 'parent' });
    expect(edges).toContainEqual({ fromNodeId: 'sis', toNodeId: 'mom', relationshipType: 'parent' });
  });

  it('tags unbridged siblings', () => {
    expect(tagsForSiblingBridgeMode('unbridged')).toEqual([UNBRIDGED_SIBLING_TAG]);
    expect(tagsForSiblingBridgeMode('shared_unknown_parent')).toBeUndefined();
  });
});
