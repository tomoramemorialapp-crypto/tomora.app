import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { colors, fonts, radii, shadows, spacing } from '@/constants/theme';

export interface GroupedOption {
  value: string;
  label: string;
}

export interface OptionGroup {
  id: string;
  label: string;
  options: GroupedOption[];
}

/**
 * Single-select dropdown with nested category sections inside the sheet.
 * Keeps the page calm (one field) while still organizing many choices.
 */
export function GroupedDropdown({
  label,
  value,
  onChange,
  groups,
  placeholder = 'Choose…',
  searchPlaceholder = 'Search…',
  sheetTitle,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  groups: OptionGroup[];
  placeholder?: string;
  searchPlaceholder?: string;
  /** Title inside the sheet; defaults to `label`. */
  sheetTitle?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const flatOptions = useMemo(
    () =>
      groups.flatMap((group) =>
        group.options.map((option) => ({
          ...option,
          groupId: group.id,
          groupLabel: group.label,
        })),
      ),
    [groups],
  );

  const selected = flatOptions.find((o) => o.value === value);
  const displayText = selected?.label ?? '';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return flatOptions.filter(
      (o) => o.label.toLowerCase().includes(q) || o.groupLabel.toLowerCase().includes(q),
    );
  }, [flatOptions, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const choose = (v: string) => {
    onChange(v);
    close();
  };

  const modalTitle = sheetTitle ?? label;

  return (
    <View style={{ gap: spacing.sm }}>
      {label ? (
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.deepUmber, letterSpacing: 0.3 }}>
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}: ${displayText || placeholder}` : displayText || placeholder}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.white,
          borderRadius: radii.md,
          borderWidth: 1.5,
          borderColor: colors.mistBeige,
          paddingHorizontal: spacing.md,
          minHeight: 54,
        }}
      >
        <Text
          numberOfLines={1}
          style={{ flex: 1, fontFamily: fonts.body, fontSize: 18, color: displayText ? colors.ink : colors.ashTaupe }}
        >
          {displayText || placeholder}
        </Text>
        <Text style={{ color: colors.ashTaupe, fontSize: 14, marginLeft: spacing.sm }}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable
          onPress={close}
          style={{
            flex: 1,
            backgroundColor: 'rgba(28,22,18,0.45)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.lg,
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              {
                width: '100%',
                maxWidth: 460,
                maxHeight: '80%',
                backgroundColor: colors.paper,
                borderRadius: radii.lg,
                padding: spacing.lg,
                gap: spacing.md,
              },
              shadows.soft,
            ]}
          >
            {modalTitle ? (
              <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.ink }}>{modalTitle}</Text>
            ) : null}

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.ashTaupe}
              autoFocus
              style={
                {
                  fontFamily: fonts.body,
                  fontSize: 16,
                  color: colors.ink,
                  backgroundColor: colors.white,
                  borderRadius: radii.md,
                  borderWidth: 1.5,
                  borderColor: colors.mistBeige,
                  paddingHorizontal: spacing.md,
                  paddingVertical: 12,
                  outlineStyle: 'none',
                } as any
              }
            />

            <ScrollView style={{ flexGrow: 0 }} keyboardShouldPersistTaps="handled">
              {filtered ? (
                filtered.length > 0 ? (
                  filtered.map((o) => (
                    <OptionRow key={o.value} label={o.label} sublabel={o.groupLabel} active={o.value === value} onPress={() => choose(o.value)} />
                  ))
                ) : (
                  <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.ashTaupe, padding: spacing.sm }}>
                    No matches.
                  </Text>
                )
              ) : (
                groups.map((group) =>
                  group.options.length > 0 ? (
                    <View key={group.id} style={{ marginBottom: spacing.sm }}>
                      <Text
                        style={{
                          fontFamily: fonts.body,
                          fontSize: 12,
                          fontWeight: '700',
                          letterSpacing: 0.6,
                          textTransform: 'uppercase',
                          color: colors.ashTaupe,
                          paddingHorizontal: spacing.sm,
                          paddingTop: spacing.sm,
                          paddingBottom: 4,
                        }}
                      >
                        {group.label}
                      </Text>
                      {group.options.map((o) => (
                        <OptionRow key={o.value} label={o.label} active={o.value === value} onPress={() => choose(o.value)} />
                      ))}
                    </View>
                  ) : null,
                )
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function OptionRow({
  label,
  sublabel,
  active,
  onPress,
}: {
  label: string;
  sublabel?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: spacing.sm,
        borderRadius: radii.md,
        backgroundColor: active ? 'rgba(184,135,47,0.12)' : 'transparent',
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: fonts.body, fontSize: 16, color: active ? colors.guardianGold : colors.ink }}>
          {label}
        </Text>
        {sublabel ? (
          <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.ashTaupe }}>{sublabel}</Text>
        ) : null}
      </View>
      {active ? <Text style={{ color: colors.guardianGold, fontWeight: '700' }}>✓</Text> : null}
    </Pressable>
  );
}
