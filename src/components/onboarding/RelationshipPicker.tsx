import { GroupedDropdown } from '@/components/ui/GroupedDropdown';
import { getGroupedAnchorChoices } from '@/lib/relationshipTaxonomy';
import type { RelationshipChoice } from '@/lib/relationshipTaxonomy';

const GROUPS = getGroupedAnchorChoices();

const CHOICE_BY_ID = new Map(GROUPS.flatMap((g) => g.choices.map((c) => [c.id, c] as const)));

/**
 * Single searchable dropdown for onboarding — categories live inside the sheet.
 */
export function RelationshipPicker({
  selectedId,
  onSelect,
}: {
  selectedId?: string;
  onSelect: (choice: RelationshipChoice) => void;
}) {
  return (
    <GroupedDropdown
      sheetTitle="Choose a relationship"
      value={selectedId ?? ''}
      onChange={(id) => {
        const choice = CHOICE_BY_ID.get(id);
        if (choice) onSelect(choice);
      }}
      groups={GROUPS.map((group) => ({
        id: group.group,
        label: group.label,
        options: group.choices.map((c) => ({ value: c.id, label: c.label })),
      }))}
      placeholder="Mother, partner, cousin…"
      searchPlaceholder="Search mother, cousin, pet…"
    />
  );
}
