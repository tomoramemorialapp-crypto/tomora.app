import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { Dropdown } from './Dropdown';
import type { CertaintyLevel, DateValue } from '@/types/profile';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_OPTIONS = MONTHS.map((m, i) => ({ value: String(i + 1), label: m }));

interface DateParts {
  day?: number;
  month?: number; // 1-12
  year?: number;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Break a stored DateValue back into editable day / month / year parts. */
export function dateValueToParts(d?: DateValue): DateParts {
  if (!d) return {};
  if (d.value && /^\d{4}-\d{2}-\d{2}$/.test(d.value)) {
    const [y, m, day] = d.value.split('-');
    return { year: Number(y), month: Number(m), day: Number(day) };
  }
  if (d.monthYearOnly && /^\d{4}-\d{2}$/.test(d.monthYearOnly)) {
    const [y, m] = d.monthYearOnly.split('-');
    return { year: Number(y), month: Number(m) };
  }
  if (d.yearOnly) return { year: d.yearOnly };
  if (d.displayText) {
    // Parse free text like "January", "January 1", "1 January 2000", "January 2000".
    const text = d.displayText.toLowerCase();
    const parts: DateParts = {};
    const monthIdx = MONTHS.findIndex((m) => text.includes(m.toLowerCase()));
    if (monthIdx >= 0) parts.month = monthIdx + 1;
    const nums = text.match(/\d+/g)?.map(Number) ?? [];
    for (const n of nums) {
      if (n > 31) parts.year = n;
      else if (!parts.day) parts.day = n;
    }
    return parts;
  }
  return {};
}

/** Compose editable parts back into a structured DateValue (or undefined). */
export function partsToDateValue(p: DateParts, certainty: CertaintyLevel): DateValue | undefined {
  const day = p.day && p.day >= 1 && p.day <= 31 ? p.day : undefined;
  const month = p.month && p.month >= 1 && p.month <= 12 ? p.month : undefined;
  const year = p.year && p.year >= 1 && p.year <= 9999 ? p.year : undefined;

  if (!day && !month && !year) return undefined;
  if (year && month && day) return { value: `${year}-${pad(month)}-${pad(day)}`, certainty };
  if (year && month) return { monthYearOnly: `${year}-${pad(month)}`, certainty };
  if (year && !month) return { yearOnly: year, certainty };
  // Month present without a year — keep a friendly display string.
  if (month) {
    const txt = day ? `${MONTHS[month - 1]} ${day}` : MONTHS[month - 1];
    return { displayText: txt, certainty };
  }
  // A lone day with no month/year isn't meaningful — ignore it.
  return undefined;
}

/**
 * Separated day / month / year date input. Every part is optional, so a user can
 * record "January", "January 1", "January 2000", "January 1, 2000", etc. Emits a
 * structured DateValue (or undefined when empty).
 */
export function DateValueInput({
  label,
  value,
  onChange,
}: {
  label?: string;
  value?: DateValue;
  onChange: (next: DateValue | undefined) => void;
}) {
  const initial = dateValueToParts(value);
  const [day, setDay] = useState(initial.day ? String(initial.day) : '');
  const [month, setMonth] = useState<number | undefined>(initial.month);
  const [year, setYear] = useState(initial.year ? String(initial.year) : '');
  const [approx, setApprox] = useState<boolean>(value?.certainty === 'approximate');

  // Emit composed value whenever a part changes (skip the very first render).
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    onChange(
      partsToDateValue(
        { day: day ? Number(day) : undefined, month, year: year ? Number(year) : undefined },
        approx ? 'approximate' : 'exact',
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, month, year, approx]);

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
        <SmallNumberField label="Day" value={day} onChangeText={(t) => setDay(t.replace(/\D/g, '').slice(0, 2))} placeholder="1–31" />
        <SmallNumberField label="Year" value={year} onChangeText={(t) => setYear(t.replace(/\D/g, '').slice(0, 4))} placeholder="e.g. 1990" wide />
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
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  wide?: boolean;
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
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
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
