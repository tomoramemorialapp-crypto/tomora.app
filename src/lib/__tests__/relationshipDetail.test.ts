import { describe, expect, it } from 'vitest';

import type { FamilyNode, Relationship } from '@/types/models';
import {
  INVERSE_RELATIONSHIP_TYPE,
  connectionLabel,
  isSpouseOfViewerChild,
  isSpousesParent,
  perspectiveDetail,
  perspectiveType,
  storedDetail,
  suggestInLawType,
} from '@/lib/relationshipDetail';

const node = (id: string, sex?: string): FamilyNode =>
  ({
    id,
    displayName: id,
    profile: sex
      ? { genderSex: { value: { sexAssignedOrRecorded: sex }, status: 'confirmed', visibility: 'private' } }
      : {},
    tags: [],
    alternateNames: [],
    memorialPrivacy: 'family',
    defaultVisibility: 'family_tree',
    status: 'claimed',
    familyTreeId: 't1',
    createdAt: '',
    updatedAt: '',
  }) as FamilyNode;

const rel = (
  from: string,
  to: string,
  type: Relationship['relationshipType'],
  detail?: Relationship['relationshipDetail'],
): Relationship => ({
  id: `${from}-${to}`,
  familyTreeId: 't1',
  fromNodeId: from,
  toNodeId: to,
  relationshipType: type,
  relationshipDetail: detail,
  status: 'approved',
  visibility: 'family_tree',
  createdByAccountId: 'a1',
  createdAt: '',
  updatedAt: '',
});

describe('relationshipDetail', () => {
  it('inverts parent-in-law to child-in-law', () => {
    expect(INVERSE_RELATIONSHIP_TYPE.parent_in_law).toBe('child_in_law');
    expect(INVERSE_RELATIONSHIP_TYPE.child_in_law).toBe('parent_in_law');
  });

  it('shows son-in-law from the in-law parent perspective', () => {
    const edge = rel('mgf', 'father', 'child_in_law', 'son_in_law');
    expect(perspectiveType(edge, 'mgf')).toBe('child_in_law');
    expect(perspectiveDetail(edge, 'mgf')).toBe('son_in_law');
    expect(connectionLabel('child_in_law', 'son_in_law')).toBe('son-in-law');
  });

  it('shows father-in-law from the child-in-law perspective', () => {
    const edge = rel('father', 'mgf', 'parent_in_law', 'father_in_law');
    expect(perspectiveType(edge, 'father')).toBe('parent_in_law');
    expect(perspectiveDetail(edge, 'father')).toBe('father_in_law');
    expect(perspectiveType(edge, 'mgf')).toBe('child_in_law');
    expect(perspectiveDetail(edge, 'mgf')).toBe('son_in_law');
  });

  it('stores inverted detail when saving from the non-source side', () => {
    expect(storedDetail(false, 'father_in_law')).toBe('son_in_law');
    expect(storedDetail(true, 'son_in_law')).toBe('son_in_law');
  });

  it('detects spouse parent as parent-in-law candidate', () => {
    const relationships = [
      rel('father', 'mother', 'spouse'),
      rel('mother', 'mgf', 'parent'),
    ];
    expect(isSpousesParent('father', 'mgf', relationships)).toBe(true);
    expect(suggestInLawType('father', 'mgf', relationships)).toBe('parent_in_law');
  });

  it('detects spouse of child as child-in-law (son-in-law)', () => {
    const relationships = [
      rel('mgm', 'mother', 'child', 'daughter'),
      rel('mother', 'father', 'spouse'),
    ];
    expect(isSpouseOfViewerChild('mgm', 'father', relationships)).toBe(true);
    expect(suggestInLawType('mgm', 'father', relationships)).toBe('child_in_law');
  });
});
