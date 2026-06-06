import { getGroupedAnchorChoices } from '@/lib/relationshipTaxonomy';
import type { RelationshipChoice } from '@/lib/relationshipTaxonomy';
import { RelationshipChoiceGrid } from './RelationshipChoiceGrid';

const GROUPS = getGroupedAnchorChoices();

/** Grouped grid of warm relationship choices (anchor perspective). */
export function RelationshipPicker({
  selectedId,
  onSelect,
}: {
  selectedId?: string;
  onSelect: (choice: RelationshipChoice) => void;
}) {
  return <RelationshipChoiceGrid groups={GROUPS} selectedId={selectedId} onSelect={onSelect} />;
}
