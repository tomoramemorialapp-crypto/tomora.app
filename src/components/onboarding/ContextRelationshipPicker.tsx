import { getGroupedContextChoices } from '@/lib/relationshipTaxonomy';
import type { RelationshipChoice } from '@/lib/relationshipTaxonomy';
import { RelationshipChoiceGrid } from './RelationshipChoiceGrid';

const GROUPS = getGroupedContextChoices();

/** Grouped relationship choices relative to a selected context person (not the anchor). */
export function ContextRelationshipPicker({
  selectedId,
  onSelect,
}: {
  selectedId?: string;
  onSelect: (choice: RelationshipChoice) => void;
}) {
  return <RelationshipChoiceGrid groups={GROUPS} selectedId={selectedId} onSelect={onSelect} />;
}
