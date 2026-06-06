import { describe, expect, it } from 'vitest';
import {
  defaultNameForPlaceholder,
  isSyntheticPlaceholder,
  relationshipTypeForPlaceholder,
} from '../materializeIntent';
import type { KinshipNode } from '../types';

function ph(partial: Partial<KinshipNode> & Pick<KinshipNode, 'id'>): KinshipNode {
  return {
    familyTreeId: 'tree1',
    displayName: 'Unknown Parent',
    nodeType: 'placeholder',
    status: 'placeholder',
    visibility: 'family_tree',
    ...partial,
  };
}

describe('materializeIntent', () => {
  it('detects synthetic bridge nodes', () => {
    expect(isSyntheticPlaceholder(ph({ id: 'ph:tree:self:parent:anchor' }))).toBe(true);
    expect(isSyntheticPlaceholder(ph({ id: 'real-node', nodeType: 'person', status: 'placeholder' }))).toBe(false);
  });

  it('maps parent bridge to parent relationship', () => {
    const node = ph({
      id: 'ph:tree:unsorted:parent:child',
      metadata: { roleLabel: 'Parent' },
      generationOffset: -1,
    });
    expect(relationshipTypeForPlaceholder(node)).toBe('parent');
  });

  it('maps aunt/uncle bridge by role', () => {
    const node = ph({
      id: 'ph:tree:mother_side:auntuncle:parent',
      displayName: 'Unknown Aunt/Uncle',
      metadata: { roleLabel: 'Aunt or Uncle' },
      generationOffset: 0,
    });
    expect(relationshipTypeForPlaceholder(node)).toBe('aunt_uncle');
    expect(defaultNameForPlaceholder(node)).toBe('Unknown aunt or uncle');
  });

  it('uses generation when role is missing', () => {
    expect(relationshipTypeForPlaceholder(ph({ id: 'ph:x', generationOffset: -2 }))).toBe('grandparent');
    expect(relationshipTypeForPlaceholder(ph({ id: 'ph:x', generationOffset: 1 }))).toBe('child');
  });
});
