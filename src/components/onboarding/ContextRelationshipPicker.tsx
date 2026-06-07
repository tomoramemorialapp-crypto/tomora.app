import { GroupedDropdown } from '@/components/ui/GroupedDropdown';
import { getGroupedContextChoices } from '@/lib/relationshipTaxonomy';
import type { RelationshipChoice } from '@/lib/relationshipTaxonomy';

const GROUPS = getGroupedContextChoices();

const CHOICE_BY_ID = new Map(GROUPS.flatMap((g) => g.choices.map((c) => [c.id, c] as const)));

/** Grouped relationship choices relative to a selected context person (not the anchor). */
export function ContextRelationshipPicker({
  selectedId,
  onSelect,
}: {
  selectedId?: string;
  onSelect: (choice: RelationshipChoice) => void;
}) {
  return (
    <GroupedDropdown
      sheetTitle="Choose their relationship"
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
      placeholder="Their mother, their cousin…"
      searchPlaceholder="Search their mother, cousin…"
    />
  );
}
