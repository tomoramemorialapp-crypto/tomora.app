import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { colors, fonts, radii, shadows, spacing } from '@/constants/theme';

export interface Option {
  value: string;
  label: string;
}

/**
 * A calm single-select dropdown. Opens a centered sheet with an optional search
 * box and an optional "Other…" row that reveals a free-text field — so a user
 * can pick from our list or record something we didn't anticipate.
 */
export function Dropdown({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select…',
  searchable = false,
  allowOther = false,
  otherLabel = 'Other…',
  otherPlaceholder = 'Type your own',
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  searchable?: boolean;
  allowOther?: boolean;
  otherLabel?: string;
  otherPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [otherMode, setOtherMode] = useState(false);
  const [otherText, setOtherText] = useState('');

  const selected = options.find((o) => o.value === value);
  const displayText = selected ? selected.label : value ? value : '';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
    setOtherMode(false);
    setOtherText('');
  };

  const choose = (v: string) => {
    onChange(v);
    close();
  };

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
          style={{ flex: 1, backgroundColor: 'rgba(28,22,18,0.45)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}
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
            {label ? (
              <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.ink }}>{label}</Text>
            ) : null}

            {searchable ? (
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search…"
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
            ) : null}

            <ScrollView style={{ flexGrow: 0 }} keyboardShouldPersistTaps="handled">
              {filtered.map((o) => {
                const active = o.value === value;
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => choose(o.value)}
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
                    <Text style={{ fontFamily: fonts.body, fontSize: 16, color: active ? colors.guardianGold : colors.ink }}>
                      {o.label}
                    </Text>
                    {active ? <Text style={{ color: colors.guardianGold, fontWeight: '700' }}>✓</Text> : null}
                  </Pressable>
                );
              })}
              {filtered.length === 0 ? (
                <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.ashTaupe, padding: spacing.sm }}>
                  No matches.
                </Text>
              ) : null}
            </ScrollView>

            {allowOther ? (
              otherMode ? (
                <View style={{ gap: spacing.sm }}>
                  <TextInput
                    value={otherText}
                    onChangeText={setOtherText}
                    placeholder={otherPlaceholder}
                    placeholderTextColor={colors.ashTaupe}
                    autoFocus
                    onSubmitEditing={() => otherText.trim() && choose(otherText.trim())}
                    style={
                      {
                        fontFamily: fonts.body,
                        fontSize: 16,
                        color: colors.ink,
                        backgroundColor: colors.white,
                        borderRadius: radii.md,
                        borderWidth: 1.5,
                        borderColor: colors.softGold,
                        paddingHorizontal: spacing.md,
                        paddingVertical: 12,
                        outlineStyle: 'none',
                      } as any
                    }
                  />
                  <Pressable
                    onPress={() => otherText.trim() && choose(otherText.trim())}
                    style={{ alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: spacing.md, borderRadius: radii.pill, backgroundColor: colors.guardianGold }}
                  >
                    <Text style={{ color: colors.paper, fontFamily: fonts.body, fontWeight: '700' }}>Use this</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => setOtherMode(true)}
                  style={{ paddingVertical: 12, paddingHorizontal: spacing.sm, borderTopWidth: 1, borderTopColor: colors.mistBeige }}
                >
                  <Text style={{ fontFamily: fonts.body, fontSize: 16, color: colors.guardianGold, fontWeight: '600' }}>
                    {otherLabel}
                  </Text>
                </Pressable>
              )
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
