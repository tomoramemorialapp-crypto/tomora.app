import { describe, expect, it } from 'vitest';

import {
  RELATIONSHIP_TAXONOMY,
  generationOffsetForChoice,
  getAnchorRelationshipChoices,
  getGroupedAnchorChoices,
  getTaxon,
  resolveChoiceStorage,
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
});
