import { describe, expect, it } from 'vitest';

import {
  buildParentPartnershipEdge,
  childIdForParentEdge,
  detectParentPairingOpportunity,
  findParentsOfChild,
  hasPartnershipBetween,
  partnershipUsesFormerDetail,
} from '@/lib/parentPairing';
import type { FamilyNode, Relationship } from '@/types/models';

const nodes: FamilyNode[] = [
  {
    id: 'child',
    familyTreeId: 't1',
    displayName: 'Alex',
    status: 'claimed',
    defaultVisibility: 'family_tree',
    profile: {} as FamilyNode['profile'],
    tags: [],
    alternateNames: [],
    memorialPrivacy: 'family',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'dad',
    familyTreeId: 't1',
    displayName: 'James',
    status: 'managed',
    defaultVisibility: 'family_tree',
    profile: {} as FamilyNode['profile'],
    tags: [],
    alternateNames: [],
    memorialPrivacy: 'family',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'mom',
    familyTreeId: 't1',
    displayName: 'Maria',
    status: 'managed',
    defaultVisibility: 'family_tree',
    profile: {} as FamilyNode['profile'],
    tags: [],
    alternateNames: [],
    memorialPrivacy: 'family',
    createdAt: '',
    updatedAt: '',
  },
];

function rel(
  from: string,
  to: string,
  type: Relationship['relationshipType'],
): Relationship {
  return {
    id: `${from}-${to}-${type}`,
    familyTreeId: 't1',
    fromNodeId: from,
    toNodeId: to,
    relationshipType: type,
    status: 'approved',
    visibility: 'family_tree',
    createdByAccountId: 'acct',
    createdAt: '',
    updatedAt: '',
  };
}

describe('parentPairing', () => {
  it('finds parents stored child → parent', () => {
    const relationships = [rel('child', 'dad', 'parent'), rel('child', 'mom', 'parent')];
    expect(findParentsOfChild('child', relationships).sort()).toEqual(['dad', 'mom']);
  });

  it('detects an unpaired parent pair', () => {
    const relationships = [rel('child', 'dad', 'parent'), rel('child', 'mom', 'parent')];
    const opportunity = detectParentPairingOpportunity({ childId: 'child', nodes, relationships });
    expect(opportunity?.parentAName).toBeTruthy();
    expect(opportunity?.parentBName).toBeTruthy();
    expect([opportunity?.parentAId, opportunity?.parentBId].sort()).toEqual(['dad', 'mom']);
  });

  it('returns null when parents are already partnered', () => {
    const relationships = [
      rel('child', 'dad', 'parent'),
      rel('child', 'mom', 'parent'),
      rel('dad', 'mom', 'spouse'),
    ];
    expect(detectParentPairingOpportunity({ childId: 'child', nodes, relationships })).toBeNull();
  });

  it('recognises existing partner edges', () => {
    const relationships = [rel('dad', 'mom', 'partner')];
    expect(hasPartnershipBetween('dad', 'mom', relationships)).toBe(true);
  });

  it('resolves child id from a parent edge', () => {
    expect(childIdForParentEdge('parent', 'child')).toBe('child');
    expect(childIdForParentEdge('sibling', 'child')).toBeNull();
  });

  it('stores former_partner detail for separated partners', () => {
    expect(partnershipUsesFormerDetail('partner', 'separated')).toBe(true);
    expect(partnershipUsesFormerDetail('partner', 'current')).toBe(false);
    const edge = buildParentPartnershipEdge({
      fromParentId: 'dad',
      toParentId: 'mom',
      choice: 'partner',
      lifecycle: 'divorced',
      nodes,
    });
    expect(edge.relationshipDetail).toBe('former_partner');
  });

  it('stores former_wife detail for separated spouses', () => {
    const edge = buildParentPartnershipEdge({
      fromParentId: 'dad',
      toParentId: 'mom',
      choice: 'spouse',
      lifecycle: 'separated',
      husbandParentId: 'dad',
      nodes,
    });
    expect(edge.relationshipType).toBe('spouse');
    expect(edge.relationshipDetail).toBe('former_wife');
  });
});
