/**
 * Gender-specific kinship labels and relationship perspective helpers.
 *
 * Stored edges keep a base `relationshipType` plus an optional `relationshipDetail`
 * from the source node's perspective: "[to] is [from]'s {detail or type}".
 */

import type { FamilyNode, Relationship, RelationshipDetail, RelationshipType } from '@/types/models';

export type { RelationshipDetail };

/** Reverse of a stored relationship type when viewing from the other endpoint. */
export const INVERSE_RELATIONSHIP_TYPE: Record<RelationshipType, RelationshipType> = {
  self: 'self',
  parent: 'child',
  step_parent: 'child',
  parent_in_law: 'child_in_law',
  child: 'parent',
  child_in_law: 'parent_in_law',
  sibling: 'sibling',
  grandparent: 'grandchild',
  grandchild: 'grandparent',
  aunt_uncle: 'niece_nephew',
  niece_nephew: 'aunt_uncle',
  cousin: 'cousin',
  spouse: 'spouse',
  partner: 'partner',
  friend: 'friend',
  pet: 'caretaker',
  caretaker: 'pet',
  chosen_family: 'chosen_family',
  other: 'other',
};

/** Flip a gendered detail when inverting edge perspective. */
export const INVERSE_RELATIONSHIP_DETAIL: Record<RelationshipDetail, RelationshipDetail> = {
  father: 'son',
  mother: 'daughter',
  stepfather: 'son',
  stepmother: 'daughter',
  father_in_law: 'son_in_law',
  mother_in_law: 'daughter_in_law',
  son: 'father',
  daughter: 'mother',
  son_in_law: 'father_in_law',
  daughter_in_law: 'mother_in_law',
  brother: 'brother',
  sister: 'sister',
  grandfather: 'grandson',
  grandmother: 'granddaughter',
  grandson: 'grandfather',
  granddaughter: 'grandmother',
  uncle: 'nephew',
  aunt: 'niece',
  nephew: 'uncle',
  niece: 'aunt',
  husband: 'wife',
  wife: 'husband',
};

export const RELATIONSHIP_DETAIL_OPTIONS: Partial<
  Record<RelationshipType, { id: RelationshipDetail; label: string }[]>
> = {
  parent: [
    { id: 'father', label: 'Father' },
    { id: 'mother', label: 'Mother' },
  ],
  step_parent: [
    { id: 'stepfather', label: 'Stepfather' },
    { id: 'stepmother', label: 'Stepmother' },
  ],
  parent_in_law: [
    { id: 'father_in_law', label: 'Father-in-law' },
    { id: 'mother_in_law', label: 'Mother-in-law' },
  ],
  child: [
    { id: 'son', label: 'Son' },
    { id: 'daughter', label: 'Daughter' },
  ],
  child_in_law: [
    { id: 'son_in_law', label: 'Son-in-law' },
    { id: 'daughter_in_law', label: 'Daughter-in-law' },
  ],
  sibling: [
    { id: 'brother', label: 'Brother' },
    { id: 'sister', label: 'Sister' },
  ],
  grandparent: [
    { id: 'grandfather', label: 'Grandfather' },
    { id: 'grandmother', label: 'Grandmother' },
  ],
  grandchild: [
    { id: 'grandson', label: 'Grandson' },
    { id: 'granddaughter', label: 'Granddaughter' },
  ],
  aunt_uncle: [
    { id: 'uncle', label: 'Uncle' },
    { id: 'aunt', label: 'Aunt' },
  ],
  niece_nephew: [
    { id: 'nephew', label: 'Nephew' },
    { id: 'niece', label: 'Niece' },
  ],
  spouse: [
    { id: 'husband', label: 'Husband' },
    { id: 'wife', label: 'Wife' },
  ],
};

const MALE_DEFAULT: Partial<Record<RelationshipType, RelationshipDetail>> = {
  parent: 'father',
  step_parent: 'stepfather',
  parent_in_law: 'father_in_law',
  child: 'son',
  child_in_law: 'son_in_law',
  sibling: 'brother',
  grandparent: 'grandfather',
  grandchild: 'grandson',
  aunt_uncle: 'uncle',
  niece_nephew: 'nephew',
  spouse: 'husband',
};

const FEMALE_DEFAULT: Partial<Record<RelationshipType, RelationshipDetail>> = {
  parent: 'mother',
  step_parent: 'stepmother',
  parent_in_law: 'mother_in_law',
  child: 'daughter',
  child_in_law: 'daughter_in_law',
  sibling: 'sister',
  grandparent: 'grandmother',
  grandchild: 'granddaughter',
  aunt_uncle: 'aunt',
  niece_nephew: 'niece',
  spouse: 'wife',
};

const DETAIL_LABEL: Record<RelationshipDetail, string> = {
  father: 'father',
  mother: 'mother',
  stepfather: 'stepfather',
  stepmother: 'stepmother',
  father_in_law: 'father-in-law',
  mother_in_law: 'mother-in-law',
  son: 'son',
  daughter: 'daughter',
  son_in_law: 'son-in-law',
  daughter_in_law: 'daughter-in-law',
  brother: 'brother',
  sister: 'sister',
  grandfather: 'grandfather',
  grandmother: 'grandmother',
  grandson: 'grandson',
  granddaughter: 'granddaughter',
  uncle: 'uncle',
  aunt: 'aunt',
  nephew: 'nephew',
  niece: 'niece',
  husband: 'husband',
  wife: 'wife',
};

const TYPE_FALLBACK_LABEL: Partial<Record<RelationshipType, string>> = {
  parent: 'parent',
  step_parent: 'step-parent',
  parent_in_law: 'parent-in-law',
  child: 'child',
  child_in_law: 'child-in-law',
  sibling: 'sibling',
  grandparent: 'grandparent',
  grandchild: 'grandchild',
  aunt_uncle: 'aunt or uncle',
  niece_nephew: 'niece or nephew',
  spouse: 'spouse',
  partner: 'partner',
};

export function relationshipTypeSupportsDetail(type: RelationshipType): boolean {
  return Boolean(RELATIONSHIP_DETAIL_OPTIONS[type]?.length);
}

export function detailOptionsForType(type: RelationshipType): { id: RelationshipDetail; label: string }[] {
  return RELATIONSHIP_DETAIL_OPTIONS[type] ?? [];
}

export function isValidDetailForType(type: RelationshipType, detail: RelationshipDetail): boolean {
  return detailOptionsForType(type).some((o) => o.id === detail);
}

/** Infer male / female from profile gender/sex fields (best-effort). */
export function inferSexBucket(node: FamilyNode): 'male' | 'female' | 'unknown' {
  const g = node.profile?.genderSex?.value;
  const text = `${g?.genderIdentity ?? ''} ${g?.sexAssignedOrRecorded ?? ''}`.toLowerCase();
  if (/\b(male|man|boy|m)\b/.test(text)) return 'male';
  if (/\b(female|woman|girl|f)\b/.test(text)) return 'female';
  return 'unknown';
}

/** Suggest a gendered detail for `other` based on profile sex/gender. */
export function suggestDetailForType(type: RelationshipType, other: FamilyNode): RelationshipDetail | undefined {
  const bucket = inferSexBucket(other);
  if (bucket === 'male') return MALE_DEFAULT[type];
  if (bucket === 'female') return FEMALE_DEFAULT[type];
  return undefined;
}

export function perspectiveType(rel: Relationship, viewerNodeId: string): RelationshipType {
  return rel.fromNodeId === viewerNodeId ? rel.relationshipType : INVERSE_RELATIONSHIP_TYPE[rel.relationshipType];
}

export function perspectiveDetail(rel: Relationship, viewerNodeId: string): RelationshipDetail | undefined {
  if (!rel.relationshipDetail) return undefined;
  if (rel.fromNodeId === viewerNodeId) return rel.relationshipDetail;
  return INVERSE_RELATIONSHIP_DETAIL[rel.relationshipDetail];
}

/** Human label for a connection from the viewer's perspective. */
export function connectionLabel(type: RelationshipType, detail?: RelationshipDetail): string {
  if (detail) return DETAIL_LABEL[detail];
  return TYPE_FALLBACK_LABEL[type] ?? type.replace(/_/g, ' ');
}

/** Caption: "[other] is [viewer]'s {label}". */
export function connectionCaption(viewerName: string, type: RelationshipType, detail?: RelationshipDetail): string {
  return `is ${viewerName}'s ${connectionLabel(type, detail)}`;
}

/** Stored detail when saving from the viewer's chosen perspective. */
export function storedDetail(
  isSource: boolean,
  perspectiveDetailValue: RelationshipDetail | undefined,
): RelationshipDetail | undefined {
  if (!perspectiveDetailValue) return undefined;
  if (isSource) return perspectiveDetailValue;
  return INVERSE_RELATIONSHIP_DETAIL[perspectiveDetailValue];
}

function childIdsOf(viewerId: string, relationships: Relationship[]): string[] {
  const ids = new Set<string>();
  for (const r of relationships) {
    if (r.fromNodeId === viewerId && r.relationshipType === 'child') ids.add(r.toNodeId);
    if (r.toNodeId === viewerId && r.relationshipType === 'parent') ids.add(r.fromNodeId);
  }
  return [...ids];
}

/** True when `otherId` is a biological parent of the viewer's spouse/partner. */
export function isSpousesParent(viewerId: string, otherId: string, relationships: Relationship[]): boolean {
  for (const r of relationships) {
    let spouseId: string | null = null;
    if (r.fromNodeId === viewerId && (r.relationshipType === 'spouse' || r.relationshipType === 'partner')) {
      spouseId = r.toNodeId;
    } else if (r.toNodeId === viewerId && (r.relationshipType === 'spouse' || r.relationshipType === 'partner')) {
      spouseId = r.fromNodeId;
    }
    if (!spouseId) continue;

    const isParent =
      relationships.some(
        (pr) => pr.fromNodeId === spouseId && pr.toNodeId === otherId && pr.relationshipType === 'parent',
      ) ||
      relationships.some(
        (pr) => pr.fromNodeId === otherId && pr.toNodeId === spouseId && pr.relationshipType === 'child',
      );
    if (isParent) return true;
  }
  return false;
}

/** True when `otherId` is the spouse/partner of one of the viewer's children. */
export function isSpouseOfViewerChild(viewerId: string, otherId: string, relationships: Relationship[]): boolean {
  for (const childId of childIdsOf(viewerId, relationships)) {
    const linked = relationships.some(
      (r) =>
        (r.fromNodeId === childId &&
          r.toNodeId === otherId &&
          (r.relationshipType === 'spouse' || r.relationshipType === 'partner')) ||
        (r.fromNodeId === otherId &&
          r.toNodeId === childId &&
          (r.relationshipType === 'spouse' || r.relationshipType === 'partner')),
    );
    if (linked) return true;
  }
  return false;
}

/** Suggest parent-in-law vs child-in-law based on spouse linkage. */
export function suggestInLawType(
  viewerId: string,
  otherId: string,
  relationships: Relationship[],
): RelationshipType | null {
  if (isSpousesParent(viewerId, otherId, relationships)) return 'parent_in_law';
  if (isSpouseOfViewerChild(viewerId, otherId, relationships)) return 'child_in_law';

  for (const r of relationships) {
    let spouseId: string | null = null;
    if (r.fromNodeId === viewerId && (r.relationshipType === 'spouse' || r.relationshipType === 'partner')) {
      spouseId = r.toNodeId;
    } else if (r.toNodeId === viewerId && (r.relationshipType === 'spouse' || r.relationshipType === 'partner')) {
      spouseId = r.fromNodeId;
    }
    if (!spouseId) continue;

    const isChild =
      relationships.some(
        (pr) => pr.fromNodeId === spouseId && pr.toNodeId === otherId && pr.relationshipType === 'child',
      ) ||
      relationships.some(
        (pr) => pr.fromNodeId === otherId && pr.toNodeId === spouseId && pr.relationshipType === 'parent',
      );
    if (isChild) return 'child_in_law';
  }

  return null;
}
