import { View } from 'react-native';

import { Dropdown } from '@/components/ui/Dropdown';
import { spacing } from '@/constants/theme';
import { getGroupedContextChoices } from '@/lib/relationshipTaxonomy';
import type { RelationshipChoice } from '@/lib/relationshipTaxonomy';

const GROUPS = getGroupedContextChoices();

/** Grouped relationship choices relative to a selected context person (not the anchor). */
export function ContextRelationshipPicker({
  selectedId,
  onSelect,
}: {
  selectedId?: string;
  onSelect: (choice: RelationshipChoice) => void;
}) {
  return (
    <View style={{ gap: spacing.md }}>
      {GROUPS.map((group) => {
        const activeInGroup = group.choices.some((c) => c.id === selectedId);
        return (
          <Dropdown
            key={group.group}
            label={group.label}
            value={activeInGroup ? (selectedId ?? '') : ''}
            onChange={(id) => {
              const choice = group.choices.find((c) => c.id === id);
              if (choice) onSelect(choice);
            }}
            options={group.choices.map((c) => ({ value: c.id, label: c.label }))}
            placeholder={`Choose their ${group.label.toLowerCase()}…`}
            searchable
          />
        );
      })}
    </View>
  );
}
