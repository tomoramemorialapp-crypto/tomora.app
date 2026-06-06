import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { colors, fonts, radii, shadows, spacing } from '@/constants/theme';
import type { Option } from './Dropdown';

/**
 * A calm multi-select with search. Pick any number of options from our list and
 * add your own with the "Other" field. Selected values render as removable chips
 * on the field itself, so the choice stays visible without opening the sheet.
 */
export function MultiSelect({
  label,
  values,
  onChange,
  options,
  placeholder = 'Select…',
  allowOther = true,
  otherPlaceholder = 'Add your own',
  helperText,
}: {
  label?: string;
  values: string[];
  onChange: (v: string[]) => void;
  options: Option[];
  placeholder?: string;
  allowOther?: boolean;
  otherPlaceholder?: string;
  helperText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [otherText, setOtherText] = useState('');

  const labelForValue = (v: string) => options.find((o) => o.value === v)?.label ?? v;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (v: string) => {
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  };

  const remove = (v: string) => onChange(values.filter((x) => x !== v));

  const addOther = () => {
    const v = otherText.trim();
    if (!v) return;
    if (!values.includes(v)) onChange([...values, v]);
    setOtherText('');
  };

  const close = () => {
    setOpen(false);
    setQuery('');
    setOtherText('');
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
        accessibilityLabel={label}
        style={{
          backgroundColor: colors.white,
          borderRadius: radii.md,
          borderWidth: 1.5,
          borderColor: colors.mistBeige,
          paddingHorizontal: spacing.md,
          paddingVertical: values.length ? 10 : 0,
          minHeight: 54,
          justifyContent: 'center',
        }}
      >
        {values.length === 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 18, color: colors.ashTaupe }}>{placeholder}</Text>
            <Text style={{ color: colors.ashTaupe, fontSize: 14 }}>▾</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {values.map((v) => (
              <View
                key={v}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'rgba(184,135,47,0.12)',
                  borderRadius: radii.pill,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                }}
              >
                <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.guardianGold }}>{labelForValue(v)}</Text>
                <Pressable onPress={() => remove(v)} hitSlop={8} accessibilityLabel={`Remove ${labelForValue(v)}`}>
                  <Text style={{ color: colors.guardianGold, fontSize: 14, fontWeight: '700' }}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </Pressable>
      {helperText ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ashTaupe }}>{helperText}</Text> : null}

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
                maxHeight: '82%',
                backgroundColor: colors.paper,
                borderRadius: radii.lg,
                padding: spacing.lg,
                gap: spacing.md,
              },
              shadows.soft,
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.ink }}>{label ?? 'Select'}</Text>
              <Pressable onPress={close} hitSlop={8}>
                <Text style={{ fontFamily: fonts.body, fontSize: 16, color: colors.guardianGold, fontWeight: '700' }}>Done</Text>
              </Pressable>
            </View>

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

            <ScrollView style={{ flexGrow: 0 }} keyboardShouldPersistTaps="handled">
              {filtered.map((o) => {
                const active = values.includes(o.value);
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => toggle(o.value)}
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
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        borderWidth: 1.5,
                        borderColor: active ? colors.guardianGold : colors.mistBeige,
                        backgroundColor: active ? colors.guardianGold : colors.white,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {active ? <Text style={{ color: colors.paper, fontSize: 12, fontWeight: '700' }}>✓</Text> : null}
                    </View>
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
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.mistBeige, paddingTop: spacing.md }}>
                <TextInput
                  value={otherText}
                  onChangeText={setOtherText}
                  placeholder={otherPlaceholder}
                  placeholderTextColor={colors.ashTaupe}
                  onSubmitEditing={addOther}
                  style={
                    {
                      flex: 1,
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
                <Pressable
                  onPress={addOther}
                  style={{ paddingVertical: 12, paddingHorizontal: spacing.md, borderRadius: radii.pill, backgroundColor: colors.guardianGold }}
                >
                  <Text style={{ color: colors.paper, fontFamily: fonts.body, fontWeight: '700' }}>Add</Text>
                </Pressable>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
