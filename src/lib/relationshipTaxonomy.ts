/**
 * Deterministic relationship taxonomy — internal IDs, categories, generation offsets,
 * and edge types. Maps to stored `relationship_type` + optional `relationship_detail`.
 */

import type { RelationshipDetail, RelationshipType } from '@/types/models';

export type RelationCategory =
  | 'consanguinity'
  | 'legal_adoptive'
  | 'affinity'
  | 'partnership'
  | 'collateral'
  | 'care'
  | 'companion'
  | 'unknown';

export type EdgeType =
  | 'parent_child'
  | 'step_parent_child'
  | 'sibling'
  | 'step_sibling'
  | 'partnership'
  | 'guardian_managed'
  | 'caretaker'
  | 'pet_owner'
  | 'pending_unknown'
  | 'placeholder_bridge';

export type PickerGroup =
  | 'parents'
  | 'grandparents'
  | 'same_generation'
  | 'aunts_uncles'
  | 'children'
  | 'in_laws'
  | 'pets'
  | 'other';

export type RelationshipTaxonId = string;

export interface RelationshipTaxon {
  id: RelationshipTaxonId;
  label: string;
  relationshipType: RelationshipType;
  relationshipDetail?: RelationshipDetail;
  category: RelationCategory;
  /** Generation relative to the anchor (viewer). */
  generationOffset: -2 | -1 | 0 | 1 | 2;
  edgeType: EdgeType;
  bridgeHint?: string;
  group: PickerGroup;
}

export interface RelationshipChoice {
  id: RelationshipTaxonId;
  label: string;
  relationshipType: RelationshipType;
  relationshipDetail?: RelationshipDetail;
  group: PickerGroup;
}

function taxon(
  partial: RelationshipTaxon,
): RelationshipTaxon {
  return partial;
}

/** Full deterministic taxonomy (spec §2.2). */
export const RELATIONSHIP_TAXONOMY: readonly RelationshipTaxon[] = [
  // A — Parents & guardians
  taxon({ id: 'biological_father', label: 'Biological Father', relationshipType: 'parent', relationshipDetail: 'father', category: 'consanguinity', generationOffset: -1, edgeType: 'parent_child', group: 'parents' }),
  taxon({ id: 'biological_mother', label: 'Biological Mother', relationshipType: 'parent', relationshipDetail: 'mother', category: 'consanguinity', generationOffset: -1, edgeType: 'parent_child', group: 'parents' }),
  taxon({ id: 'adoptive_father', label: 'Adoptive Father', relationshipType: 'parent', relationshipDetail: 'adoptive_father', category: 'legal_adoptive', generationOffset: -1, edgeType: 'parent_child', group: 'parents' }),
  taxon({ id: 'adoptive_mother', label: 'Adoptive Mother', relationshipType: 'parent', relationshipDetail: 'adoptive_mother', category: 'legal_adoptive', generationOffset: -1, edgeType: 'parent_child', group: 'parents' }),
  taxon({ id: 'step_father', label: 'Step-Father', relationshipType: 'step_parent', relationshipDetail: 'stepfather', category: 'affinity', generationOffset: -1, edgeType: 'step_parent_child', group: 'parents' }),
  taxon({ id: 'step_mother', label: 'Step-Mother', relationshipType: 'step_parent', relationshipDetail: 'stepmother', category: 'affinity', generationOffset: -1, edgeType: 'step_parent_child', group: 'parents' }),
  taxon({ id: 'father', label: 'Father', relationshipType: 'parent', relationshipDetail: 'father', category: 'consanguinity', generationOffset: -1, edgeType: 'parent_child', group: 'parents', bridgeHint: 'Refine biological/adoptive/step later' }),
  taxon({ id: 'mother', label: 'Mother', relationshipType: 'parent', relationshipDetail: 'mother', category: 'consanguinity', generationOffset: -1, edgeType: 'parent_child', group: 'parents', bridgeHint: 'Refine biological/adoptive/step later' }),
  taxon({ id: 'guardian', label: 'Guardian', relationshipType: 'caretaker', relationshipDetail: 'guardian', category: 'care', generationOffset: -1, edgeType: 'guardian_managed', group: 'parents' }),
  taxon({ id: 'caretaker', label: 'Caretaker', relationshipType: 'caretaker', relationshipDetail: 'caretaker', category: 'care', generationOffset: 0, edgeType: 'caretaker', group: 'parents' }),

  // B — Grandparents
  taxon({ id: 'paternal_grandfather', label: 'Paternal Grandfather', relationshipType: 'grandparent', relationshipDetail: 'paternal_grandfather', category: 'consanguinity', generationOffset: -2, edgeType: 'parent_child', bridgeHint: 'Father', group: 'grandparents' }),
  taxon({ id: 'paternal_grandmother', label: 'Paternal Grandmother', relationshipType: 'grandparent', relationshipDetail: 'paternal_grandmother', category: 'consanguinity', generationOffset: -2, edgeType: 'parent_child', bridgeHint: 'Father', group: 'grandparents' }),
  taxon({ id: 'maternal_grandfather', label: 'Maternal Grandfather', relationshipType: 'grandparent', relationshipDetail: 'maternal_grandfather', category: 'consanguinity', generationOffset: -2, edgeType: 'parent_child', bridgeHint: 'Mother', group: 'grandparents' }),
  taxon({ id: 'maternal_grandmother', label: 'Maternal Grandmother', relationshipType: 'grandparent', relationshipDetail: 'maternal_grandmother', category: 'consanguinity', generationOffset: -2, edgeType: 'parent_child', bridgeHint: 'Mother', group: 'grandparents' }),
  taxon({ id: 'grandfather', label: 'Grandfather', relationshipType: 'grandparent', relationshipDetail: 'grandfather', category: 'consanguinity', generationOffset: -2, edgeType: 'parent_child', group: 'grandparents' }),
  taxon({ id: 'grandmother', label: 'Grandmother', relationshipType: 'grandparent', relationshipDetail: 'grandmother', category: 'consanguinity', generationOffset: -2, edgeType: 'parent_child', group: 'grandparents' }),
  taxon({ id: 'step_grandfather', label: 'Step-Grandfather', relationshipType: 'grandparent', relationshipDetail: 'step_grandfather', category: 'affinity', generationOffset: -2, edgeType: 'step_parent_child', group: 'grandparents' }),
  taxon({ id: 'step_grandmother', label: 'Step-Grandmother', relationshipType: 'grandparent', relationshipDetail: 'step_grandmother', category: 'affinity', generationOffset: -2, edgeType: 'step_parent_child', group: 'grandparents' }),

  // C — Same generation
  taxon({ id: 'brother', label: 'Brother', relationshipType: 'sibling', relationshipDetail: 'brother', category: 'consanguinity', generationOffset: 0, edgeType: 'sibling', group: 'same_generation' }),
  taxon({ id: 'sister', label: 'Sister', relationshipType: 'sibling', relationshipDetail: 'sister', category: 'consanguinity', generationOffset: 0, edgeType: 'sibling', group: 'same_generation' }),
  taxon({ id: 'half_brother', label: 'Half-Brother', relationshipType: 'sibling', relationshipDetail: 'half_brother', category: 'consanguinity', generationOffset: 0, edgeType: 'sibling', group: 'same_generation' }),
  taxon({ id: 'half_sister', label: 'Half-Sister', relationshipType: 'sibling', relationshipDetail: 'half_sister', category: 'consanguinity', generationOffset: 0, edgeType: 'sibling', group: 'same_generation' }),
  taxon({ id: 'step_brother', label: 'Step-Brother', relationshipType: 'sibling', relationshipDetail: 'step_brother', category: 'affinity', generationOffset: 0, edgeType: 'step_sibling', group: 'same_generation' }),
  taxon({ id: 'step_sister', label: 'Step-Sister', relationshipType: 'sibling', relationshipDetail: 'step_sister', category: 'affinity', generationOffset: 0, edgeType: 'step_sibling', group: 'same_generation' }),
  taxon({ id: 'husband', label: 'Husband', relationshipType: 'spouse', relationshipDetail: 'husband', category: 'partnership', generationOffset: 0, edgeType: 'partnership', group: 'same_generation' }),
  taxon({ id: 'wife', label: 'Wife', relationshipType: 'spouse', relationshipDetail: 'wife', category: 'partnership', generationOffset: 0, edgeType: 'partnership', group: 'same_generation' }),
  taxon({ id: 'partner', label: 'Partner', relationshipType: 'partner', category: 'partnership', generationOffset: 0, edgeType: 'partnership', group: 'same_generation' }),
  taxon({ id: 'former_husband', label: 'Former Husband', relationshipType: 'spouse', relationshipDetail: 'former_husband', category: 'partnership', generationOffset: 0, edgeType: 'partnership', group: 'same_generation' }),
  taxon({ id: 'former_wife', label: 'Former Wife', relationshipType: 'spouse', relationshipDetail: 'former_wife', category: 'partnership', generationOffset: 0, edgeType: 'partnership', group: 'same_generation' }),
  taxon({ id: 'former_partner', label: 'Former Partner', relationshipType: 'partner', relationshipDetail: 'former_partner', category: 'partnership', generationOffset: 0, edgeType: 'partnership', group: 'same_generation' }),
  taxon({ id: 'cousin_male', label: 'Male Cousin', relationshipType: 'cousin', relationshipDetail: 'cousin_male', category: 'collateral', generationOffset: 0, edgeType: 'parent_child', bridgeHint: 'Aunt/uncle', group: 'same_generation' }),
  taxon({ id: 'cousin_female', label: 'Female Cousin', relationshipType: 'cousin', relationshipDetail: 'cousin_female', category: 'collateral', generationOffset: 0, edgeType: 'parent_child', bridgeHint: 'Aunt/uncle', group: 'same_generation' }),
  taxon({ id: 'cousin', label: 'Cousin', relationshipType: 'cousin', category: 'collateral', generationOffset: 0, edgeType: 'parent_child', group: 'same_generation' }),

  // D — Aunts & uncles
  taxon({ id: 'paternal_uncle', label: 'Paternal Uncle', relationshipType: 'aunt_uncle', relationshipDetail: 'paternal_uncle', category: 'consanguinity', generationOffset: -1, edgeType: 'parent_child', bridgeHint: 'Father', group: 'aunts_uncles' }),
  taxon({ id: 'paternal_aunt', label: 'Paternal Aunt', relationshipType: 'aunt_uncle', relationshipDetail: 'paternal_aunt', category: 'consanguinity', generationOffset: -1, edgeType: 'parent_child', bridgeHint: 'Father', group: 'aunts_uncles' }),
  taxon({ id: 'maternal_uncle', label: 'Maternal Uncle', relationshipType: 'aunt_uncle', relationshipDetail: 'maternal_uncle', category: 'consanguinity', generationOffset: -1, edgeType: 'parent_child', bridgeHint: 'Mother', group: 'aunts_uncles' }),
  taxon({ id: 'maternal_aunt', label: 'Maternal Aunt', relationshipType: 'aunt_uncle', relationshipDetail: 'maternal_aunt', category: 'consanguinity', generationOffset: -1, edgeType: 'parent_child', bridgeHint: 'Mother', group: 'aunts_uncles' }),
  taxon({ id: 'uncle', label: 'Uncle', relationshipType: 'aunt_uncle', relationshipDetail: 'uncle', category: 'collateral', generationOffset: -1, edgeType: 'parent_child', group: 'aunts_uncles' }),
  taxon({ id: 'aunt', label: 'Aunt', relationshipType: 'aunt_uncle', relationshipDetail: 'aunt', category: 'collateral', generationOffset: -1, edgeType: 'parent_child', group: 'aunts_uncles' }),
  taxon({ id: 'uncle_by_marriage', label: 'Uncle by Marriage', relationshipType: 'aunt_uncle', relationshipDetail: 'uncle_by_marriage', category: 'affinity', generationOffset: -1, edgeType: 'partnership', group: 'aunts_uncles' }),
  taxon({ id: 'aunt_by_marriage', label: 'Aunt by Marriage', relationshipType: 'aunt_uncle', relationshipDetail: 'aunt_by_marriage', category: 'affinity', generationOffset: -1, edgeType: 'partnership', group: 'aunts_uncles' }),

  // E — Children & grandchildren
  taxon({ id: 'biological_son', label: 'Biological Son', relationshipType: 'child', relationshipDetail: 'son', category: 'consanguinity', generationOffset: 1, edgeType: 'parent_child', group: 'children' }),
  taxon({ id: 'biological_daughter', label: 'Biological Daughter', relationshipType: 'child', relationshipDetail: 'daughter', category: 'consanguinity', generationOffset: 1, edgeType: 'parent_child', group: 'children' }),
  taxon({ id: 'adopted_son', label: 'Adopted Son', relationshipType: 'child', relationshipDetail: 'adopted_son', category: 'legal_adoptive', generationOffset: 1, edgeType: 'parent_child', group: 'children' }),
  taxon({ id: 'adopted_daughter', label: 'Adopted Daughter', relationshipType: 'child', relationshipDetail: 'adopted_daughter', category: 'legal_adoptive', generationOffset: 1, edgeType: 'parent_child', group: 'children' }),
  taxon({ id: 'step_son', label: 'Step-Son', relationshipType: 'child', relationshipDetail: 'step_son', category: 'affinity', generationOffset: 1, edgeType: 'step_parent_child', group: 'children' }),
  taxon({ id: 'step_daughter', label: 'Step-Daughter', relationshipType: 'child', relationshipDetail: 'step_daughter', category: 'affinity', generationOffset: 1, edgeType: 'step_parent_child', group: 'children' }),
  taxon({ id: 'son', label: 'Son', relationshipType: 'child', relationshipDetail: 'son', category: 'consanguinity', generationOffset: 1, edgeType: 'parent_child', group: 'children' }),
  taxon({ id: 'daughter', label: 'Daughter', relationshipType: 'child', relationshipDetail: 'daughter', category: 'consanguinity', generationOffset: 1, edgeType: 'parent_child', group: 'children' }),
  taxon({ id: 'grandson', label: 'Grandson', relationshipType: 'grandchild', relationshipDetail: 'grandson', category: 'consanguinity', generationOffset: 2, edgeType: 'parent_child', group: 'children' }),
  taxon({ id: 'granddaughter', label: 'Granddaughter', relationshipType: 'grandchild', relationshipDetail: 'granddaughter', category: 'consanguinity', generationOffset: 2, edgeType: 'parent_child', group: 'children' }),

  // F — Niece/nephew
  taxon({ id: 'nephew', label: 'Nephew', relationshipType: 'niece_nephew', relationshipDetail: 'nephew', category: 'collateral', generationOffset: 1, edgeType: 'sibling', bridgeHint: 'Sibling', group: 'children' }),
  taxon({ id: 'niece', label: 'Niece', relationshipType: 'niece_nephew', relationshipDetail: 'niece', category: 'collateral', generationOffset: 1, edgeType: 'sibling', bridgeHint: 'Sibling', group: 'children' }),
  taxon({ id: 'step_nephew', label: 'Step-Nephew', relationshipType: 'niece_nephew', relationshipDetail: 'step_nephew', category: 'affinity', generationOffset: 1, edgeType: 'step_sibling', group: 'children' }),
  taxon({ id: 'step_niece', label: 'Step-Niece', relationshipType: 'niece_nephew', relationshipDetail: 'step_niece', category: 'affinity', generationOffset: 1, edgeType: 'step_sibling', group: 'children' }),

  // G — In-laws
  taxon({ id: 'father_in_law', label: 'Father-in-Law', relationshipType: 'parent_in_law', relationshipDetail: 'father_in_law', category: 'affinity', generationOffset: -1, edgeType: 'partnership', bridgeHint: 'Partner', group: 'in_laws' }),
  taxon({ id: 'mother_in_law', label: 'Mother-in-Law', relationshipType: 'parent_in_law', relationshipDetail: 'mother_in_law', category: 'affinity', generationOffset: -1, edgeType: 'partnership', bridgeHint: 'Partner', group: 'in_laws' }),
  taxon({ id: 'son_in_law', label: 'Son-in-Law', relationshipType: 'child_in_law', relationshipDetail: 'son_in_law', category: 'affinity', generationOffset: 1, edgeType: 'partnership', bridgeHint: 'Child', group: 'in_laws' }),
  taxon({ id: 'daughter_in_law', label: 'Daughter-in-Law', relationshipType: 'child_in_law', relationshipDetail: 'daughter_in_law', category: 'affinity', generationOffset: 1, edgeType: 'partnership', bridgeHint: 'Child', group: 'in_laws' }),
  taxon({ id: 'brother_in_law', label: 'Brother-in-Law', relationshipType: 'sibling', relationshipDetail: 'brother_in_law', category: 'affinity', generationOffset: 0, edgeType: 'partnership', group: 'in_laws' }),
  taxon({ id: 'sister_in_law', label: 'Sister-in-Law', relationshipType: 'sibling', relationshipDetail: 'sister_in_law', category: 'affinity', generationOffset: 0, edgeType: 'partnership', group: 'in_laws' }),

  // H — Pets
  taxon({ id: 'pet', label: 'Pet', relationshipType: 'pet', category: 'companion', generationOffset: 1, edgeType: 'pet_owner', group: 'pets' }),
  taxon({ id: 'family_pet', label: 'Family Pet', relationshipType: 'pet', category: 'companion', generationOffset: 1, edgeType: 'pet_owner', group: 'pets' }),

  // I — Uncertain
  taxon({ id: 'unsure', label: 'Not sure yet', relationshipType: 'other', category: 'unknown', generationOffset: 0, edgeType: 'pending_unknown', group: 'other' }),
] as const;

const TAXON_BY_ID = new Map(RELATIONSHIP_TAXONOMY.map((t) => [t.id, t]));

export const PICKER_GROUP_LABELS: Record<PickerGroup, string> = {
  parents: 'Parents & guardians',
  grandparents: 'Grandparents',
  same_generation: 'Siblings & partners',
  aunts_uncles: 'Aunts & uncles',
  children: 'Children & grandchildren',
  in_laws: 'In-laws',
  pets: 'Pets',
  other: 'Other',
};

/** Curated choices for onboarding / add-relative (anchor perspective). */
export const CURATED_ANCHOR_TAXON_IDS: RelationshipTaxonId[] = [
  'mother',
  'father',
  'step_mother',
  'step_father',
  'adoptive_mother',
  'adoptive_father',
  'guardian',
  'caretaker',
  'grandmother',
  'grandfather',
  'paternal_grandmother',
  'paternal_grandfather',
  'maternal_grandmother',
  'maternal_grandfather',
  'step_grandmother',
  'step_grandfather',
  'brother',
  'sister',
  'half_brother',
  'half_sister',
  'step_brother',
  'step_sister',
  'husband',
  'wife',
  'partner',
  'former_husband',
  'former_wife',
  'former_partner',
  'cousin',
  'cousin_male',
  'cousin_female',
  'aunt',
  'uncle',
  'paternal_aunt',
  'paternal_uncle',
  'maternal_aunt',
  'maternal_uncle',
  'aunt_by_marriage',
  'uncle_by_marriage',
  'son',
  'daughter',
  'step_son',
  'step_daughter',
  'adopted_son',
  'adopted_daughter',
  'grandson',
  'granddaughter',
  'nephew',
  'niece',
  'step_nephew',
  'step_niece',
  'father_in_law',
  'mother_in_law',
  'son_in_law',
  'daughter_in_law',
  'brother_in_law',
  'sister_in_law',
  'pet',
  'family_pet',
  'unsure',
];

export function getTaxon(id: RelationshipTaxonId): RelationshipTaxon | undefined {
  return TAXON_BY_ID.get(id);
}

export function taxonToChoice(t: RelationshipTaxon): RelationshipChoice {
  return {
    id: t.id,
    label: t.label,
    relationshipType: t.relationshipType,
    relationshipDetail: t.relationshipDetail,
    group: t.group,
  };
}

export function getAnchorRelationshipChoices(): RelationshipChoice[] {
  return CURATED_ANCHOR_TAXON_IDS.map((id) => taxonToChoice(TAXON_BY_ID.get(id)!));
}

function contextualChoiceLabel(t: RelationshipTaxon): string {
  return `Their ${t.label.charAt(0).toLowerCase()}${t.label.slice(1)}`;
}

/** Resolve taxonomy edge type from stored relationship fields (best match). */
export function resolveEdgeTypeForStorage(
  relationshipType: RelationshipType,
  relationshipDetail?: RelationshipDetail,
): EdgeType | undefined {
  const exact = RELATIONSHIP_TAXONOMY.find(
    (t) => t.relationshipType === relationshipType && t.relationshipDetail === relationshipDetail,
  );
  if (exact) return exact.edgeType;

  const generic = RELATIONSHIP_TAXONOMY.find(
    (t) => t.relationshipType === relationshipType && t.relationshipDetail === undefined,
  );
  return generic?.edgeType;
}

/** Validate every curated taxon id resolves to storage + taxonomy metadata. */
export function validateCuratedTaxonomyIntegrity(): string[] {
  const errors: string[] = [];
  for (const id of CURATED_ANCHOR_TAXON_IDS) {
    const taxon = TAXON_BY_ID.get(id);
    if (!taxon) {
      errors.push(`Missing taxon for curated id: ${id}`);
      continue;
    }
    const choice = taxonToChoice(taxon);
    const stored = resolveChoiceStorage(choice);
    if (stored.relationshipType !== taxon.relationshipType) {
      errors.push(`${id}: storage type mismatch`);
    }
    if (stored.relationshipDetail !== taxon.relationshipDetail) {
      errors.push(`${id}: storage detail mismatch`);
    }
    if (!taxon.edgeType) {
      errors.push(`${id}: missing edgeType`);
    }
  }
  return errors;
}

export function getGroupedAnchorChoices(): { group: PickerGroup; label: string; choices: RelationshipChoice[] }[] {
  const choices = getAnchorRelationshipChoices();
  const order: PickerGroup[] = ['parents', 'grandparents', 'same_generation', 'aunts_uncles', 'children', 'in_laws', 'pets', 'other'];
  return order
    .map((group) => ({
      group,
      label: PICKER_GROUP_LABELS[group],
      choices: choices.filter((c) => c.group === group),
    }))
    .filter((g) => g.choices.length > 0);
}

/** Contextual add — relative to a selected node. */
export function getGroupedContextChoices(): { group: PickerGroup; label: string; choices: RelationshipChoice[] }[] {
  const choices = getContextRelationshipChoices();
  const order: PickerGroup[] = ['parents', 'grandparents', 'same_generation', 'aunts_uncles', 'children', 'in_laws', 'pets', 'other'];
  return order
    .map((group) => ({
      group,
      label: PICKER_GROUP_LABELS[group],
      choices: choices.filter((c) => c.group === group),
    }))
    .filter((g) => g.choices.length > 0);
}

export function getContextRelationshipChoices(): RelationshipChoice[] {
  return CURATED_ANCHOR_TAXON_IDS.map((id) => {
    const taxon = TAXON_BY_ID.get(id)!;
    return {
      ...taxonToChoice(taxon),
      label: contextualChoiceLabel(taxon),
    };
  });
}

export function generationOffsetForChoice(choice: Pick<RelationshipChoice, 'id' | 'relationshipType'>): -2 | -1 | 0 | 1 | 2 {
  const taxon = getTaxon(choice.id);
  if (taxon) return taxon.generationOffset;
  // Fallback for legacy ids
  if (['parent', 'step_parent', 'parent_in_law', 'grandparent', 'aunt_uncle'].includes(choice.relationshipType)) return -1;
  if (['child', 'grandchild', 'niece_nephew', 'pet'].includes(choice.relationshipType)) return 1;
  return 0;
}

export function resolveChoiceStorage(choice: RelationshipChoice): {
  relationshipType: RelationshipType;
  relationshipDetail?: RelationshipDetail;
} {
  return {
    relationshipType: choice.relationshipType,
    relationshipDetail: choice.relationshipDetail,
  };
}
