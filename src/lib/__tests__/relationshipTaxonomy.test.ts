import { describe, expect, it } from 'vitest';

import {
  CURATED_ANCHOR_TAXON_IDS,
  RELATIONSHIP_TAXONOMY,
  generationOffsetForChoice,
  getAnchorRelationshipChoices,
  getContextRelationshipChoices,
  getGroupedAnchorChoices,
  getTaxon,
  resolveChoiceStorage,
  resolveEdgeTypeForStorage,
  validateCuratedTaxonomyIntegrity,
} from '@/lib/relationshipTaxonomy';

describe('relationshipTaxonomy', () => {
  it('defines unique taxon ids', () => {
    const ids = RELATIONSHIP_TAXONOMY.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('maps step-mother to step_parent + stepmother detail', () => {
    const taxon = getTaxon('step_mother');
    expect(taxon?.relationshipType).toBe('step_parent');
    expect(taxon?.relationshipDetail).toBe('stepmother');
    expect(taxon?.category).toBe('affinity');
    expect(taxon?.edgeType).toBe('step_parent_child');
  });

  it('does not assume father spouse equals mother', () => {
    const father = getTaxon('father');
    const mother = getTaxon('mother');
    expect(father?.relationshipType).toBe('parent');
    expect(mother?.relationshipType).toBe('parent');
    expect(father?.id).not.toBe(mother?.id);
  });

  it('curates anchor choices with grouped parents first', () => {
    const groups = getGroupedAnchorChoices();
    expect(groups[0]?.group).toBe('parents');
    expect(groups[0]?.choices.some((c) => c.id === 'mother')).toBe(true);
  });

  it('includes commonly requested anchor relationship variants', () => {
    const ids = new Set(getAnchorRelationshipChoices().map((c) => c.id));
    for (const id of [
      'guardian',
      'paternal_grandfather',
      'maternal_grandfather',
      'half_sister',
      'step_sister',
      'maternal_aunt',
      'paternal_uncle',
      'step_son',
    ]) {
      expect(ids.has(id), `missing ${id}`).toBe(true);
    }
  });

  it('resolves storage fields from a choice', () => {
    const choice = getAnchorRelationshipChoices().find((c) => c.id === 'paternal_aunt');
    expect(choice).toBeDefined();
    expect(resolveChoiceStorage(choice!)).toEqual({
      relationshipType: 'aunt_uncle',
      relationshipDetail: 'paternal_aunt',
    });
  });

  it('derives generation offset from taxon id', () => {
    expect(generationOffsetForChoice({ id: 'grandmother', relationshipType: 'grandparent' })).toBe(-2);
    expect(generationOffsetForChoice({ id: 'son', relationshipType: 'child' })).toBe(1);
    expect(generationOffsetForChoice({ id: 'brother', relationshipType: 'sibling' })).toBe(0);
  });

  it('keeps curated anchor and context choices aligned', () => {
    const anchorIds = getAnchorRelationshipChoices().map((c) => c.id);
    const contextIds = getContextRelationshipChoices().map((c) => c.id);
    expect(contextIds).toEqual(anchorIds);
    expect(anchorIds).toEqual(CURATED_ANCHOR_TAXON_IDS);
  });

  it('labels context choices relative to the selected person', () => {
    const guardian = getContextRelationshipChoices().find((c) => c.id === 'guardian');
    expect(guardian?.label).toBe('Their guardian');
    expect(guardian?.relationshipDetail).toBe('guardian');
  });

  it('passes curated taxonomy integrity checks', () => {
    expect(validateCuratedTaxonomyIntegrity()).toEqual([]);
  });

  it('resolves kinship edge types from storage fields', () => {
    expect(resolveEdgeTypeForStorage('caretaker', 'guardian')).toBe('guardian_managed');
    expect(resolveEdgeTypeForStorage('caretaker', 'caretaker')).toBe('caretaker');
    expect(resolveEdgeTypeForStorage('child', 'step_son')).toBe('step_parent_child');
    expect(resolveEdgeTypeForStorage('grandparent', 'paternal_grandfather')).toBe('parent_child');
    expect(resolveEdgeTypeForStorage('pet')).toBe('pet_owner');
  });
});
