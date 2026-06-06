import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { DateValueInput } from '@/components/ui/DateValueInput';
import { Dropdown } from '@/components/ui/Dropdown';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TextField } from '@/components/ui/TextField';
import { Caption } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import {
  PREVIOUS_NAME_TYPE_OPTIONS,
  newPreviousNameDraft,
  type PreviousNameDraft,
} from '@/lib/previousNames';
import type { PreviousNameType } from '@/types/profile';

/** Optional prior names — maiden names, legal changes, and other record names. */
export function PreviousNamesEditor({
  entries,
  onChange,
}: {
  entries: PreviousNameDraft[];
  onChange: (next: PreviousNameDraft[]) => void;
}) {
  const update = (id: string, patch: Partial<PreviousNameDraft>) => {
    onChange(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const remove = (id: string) => {
    onChange(entries.filter((e) => e.id !== id));
  };

  return (
    <View style={{ gap: spacing.md }}>
      <SectionHeader title="Previous Names" />
      <Caption style={{ color: colors.ashTaupe }}>
        Maiden names, married names, legal changes, and other names this person used in records.
      </Caption>

      {entries.length === 0 ? (
        <Caption>No previous names yet.</Caption>
      ) : (
        entries.map((entry, index) => (
          <View
            key={entry.id}
            style={{
              gap: spacing.sm,
              borderWidth: 1,
              borderColor: colors.mistBeige,
              borderRadius: radii.md,
              padding: spacing.sm,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Caption style={{ fontWeight: '700', color: colors.deepUmber }}>Name {index + 1}</Caption>
              <Pressable onPress={() => remove(entry.id)} hitSlop={8}>
                <Caption style={{ color: colors.error }}>Remove</Caption>
              </Pressable>
            </View>
            <TextField
              label="Name"
              value={entry.name}
              onChangeText={(name) => update(entry.id, { name })}
              placeholder="e.g. Smith (maiden)"
              autoCapitalize="words"
            />
            <Dropdown
              label="Type"
              value={entry.type}
              onChange={(v) => update(entry.id, { type: v as PreviousNameType | '' })}
              options={[{ value: '', label: 'Choose type (optional)' }, ...PREVIOUS_NAME_TYPE_OPTIONS.map((o) => ({ value: o.id, label: o.label }))]}
              placeholder="Choose type"
            />
            <DateValueInput
              label="From (optional)"
              value={entry.fromDate}
              onChange={(fromDate) => update(entry.id, { fromDate })}
            />
            <DateValueInput
              label="To (optional)"
              value={entry.toDate}
              onChange={(toDate) => update(entry.id, { toDate })}
            />
            <TextField
              label="Notes"
              value={entry.notes}
              onChangeText={(notes) => update(entry.id, { notes })}
              placeholder="Optional context"
            />
          </View>
        ))
      )}

      <Button
        label="Add previous name"
        variant="secondary"
        onPress={() => onChange([...entries, newPreviousNameDraft()])}
      />
    </View>
  );
}
