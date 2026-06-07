import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import {
  dateValueToParts,
  dateValueToStorageIso,
  MONTH_LABELS,
  partsToDateValue,
} from '@/lib/dateValue';
import { Dropdown } from './Dropdown';
import type { DateValue } from '@/types/profile';

export {
  dateValueToParts,
  dateValueToStorageIso,
  isoToDateValue,
  partsToDateValue,
} from '@/lib/dateValue';

const MONTH_OPTIONS = MONTH_LABELS.map((m, i) => ({ value: String(i + 1), label: m }));

/**
 * Separated day / month / year date input. Every part is optional, so a user can
 * record "January", "January 1", "January 2000", "January 1, 2000", etc. Emits a
 * structured DateValue (or undefined when empty).
 */
export function DateValueInput({
  label,
  value,
  onChange,
  debounceMs = 450,
}: {
  label?: string;
  value?: DateValue;
  onChange: (next: DateValue | undefined) => void;
  /** Delay before emitting changes (avoids saving partial year digits). */
  debounceMs?: number;
}) {
  const initial = dateValueToParts(value);
  const [day, setDay] = useState(initial.day ? String(initial.day) : '');
  const [month, setMonth] = useState<number | undefined>(initial.month);
  const [year, setYear] = useState(initial.year ? String(initial.year) : '');
  const [approx, setApprox] = useState<boolean>(value?.certainty === 'approximate');

  const editingRef = useRef(false);
  const mounted = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const valueKey = dateValueToStorageIso(value) ?? '';

  // Keep fields in sync when the stored value changes externally (not while the user is editing).
  useEffect(() => {
    if (editingRef.current) return;
    const parts = dateValueToParts(value);
    setDay(parts.day ? String(parts.day) : '');
    setMonth(parts.month);
    setYear(parts.year ? String(parts.year) : '');
    setApprox(value?.certainty === 'approximate');
  }, [valueKey, value]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChangeRef.current(
        partsToDateValue(
          { day: day ? Number(day) : undefined, month, year: year ? Number(year) : undefined },
          approx ? 'approximate' : 'exact',
        ),
      );
    }, debounceMs);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [day, month, year, approx, debounceMs]);

  const onEditStart = () => {
    editingRef.current = true;
  };
  const onEditEnd = () => {
    editingRef.current = false;
  };

  return (
    <View style={{ gap: spacing.sm }}>
      {label ? (
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.deepUmber, letterSpacing: 0.3 }}>
          {label}
        </Text>
      ) : null}

      {/* Month dropdown */}
      <Dropdown
        value={month ? String(month) : ''}
        onChange={(v) => setMonth(v ? Number(v) : undefined)}
        options={[{ value: '', label: 'No month' }, ...MONTH_OPTIONS]}
        placeholder="Month (optional)"
      />

      {/* Day + Year */}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <SmallNumberField
          label="Day"
          value={day}
          onChangeText={(t) => setDay(t.replace(/\D/g, '').slice(0, 2))}
          placeholder="1–31"
          onFocus={onEditStart}
          onBlur={onEditEnd}
        />
        <SmallNumberField
          label="Year"
          value={year}
          onChangeText={(t) => setYear(t.replace(/\D/g, '').slice(0, 4))}
          placeholder="e.g. 1990"
          wide
          onFocus={onEditStart}
          onBlur={onEditEnd}
        />
      </View>

      <Pressable
        onPress={() => setApprox((v) => !v)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: approx }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            borderWidth: 1.5,
            borderColor: approx ? colors.guardianGold : colors.mistBeige,
            backgroundColor: approx ? colors.guardianGold : colors.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {approx ? <Text style={{ color: colors.paper, fontSize: 12, fontWeight: '700' }}>✓</Text> : null}
        </View>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.deepUmber }}>Approximate date</Text>
      </Pressable>
    </View>
  );
}

function SmallNumberField({
  label,
  value,
  onChangeText,
  placeholder,
  wide = false,
  onFocus,
  onBlur,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  wide?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ flex: wide ? 1.4 : 1, gap: 6 }}>
      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ashTaupe }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.ashTaupe}
        keyboardType="number-pad"
        inputMode="numeric"
        onFocus={() => {
          setFocused(true);
          onFocus?.();
        }}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        style={
          {
            fontFamily: fonts.body,
            fontSize: 17,
            color: colors.ink,
            backgroundColor: colors.white,
            borderRadius: radii.md,
            borderWidth: 1.5,
            borderColor: focused ? colors.softGold : colors.mistBeige,
            paddingHorizontal: spacing.md,
            paddingVertical: 12,
            outlineStyle: 'none',
          } as any
        }
      />
    </View>
  );
}
