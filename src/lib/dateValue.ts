import type { CertaintyLevel, DateValue } from '@/types/profile';

export const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export interface DateParts {
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
    const text = d.displayText.toLowerCase();
    const parts: DateParts = {};
    const monthIdx = MONTH_LABELS.findIndex((m) => text.includes(m.toLowerCase()));
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

/** Parse a stored ISO date string (YYYY-MM-DD, YYYY-MM, or YYYY) into a DateValue. */
export function isoToDateValue(iso?: string): DateValue | undefined {
  if (!iso) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return { value: iso, certainty: 'exact' };
  if (/^\d{4}-\d{2}$/.test(iso)) return { monthYearOnly: iso, certainty: 'exact' };
  if (/^\d{4}$/.test(iso)) return { yearOnly: Number(iso), certainty: 'exact' };
  return undefined;
}

/** Serialize a DateValue to a compact ISO string for storage (or null when empty). */
export function dateValueToStorageIso(d?: DateValue): string | null {
  if (!d) return null;
  if (d.value) return d.value;
  if (d.monthYearOnly) return d.monthYearOnly;
  if (d.yearOnly) return String(d.yearOnly);
  return null;
}

/** Compose editable parts back into a structured DateValue (or undefined). */
export function partsToDateValue(p: DateParts, certainty: CertaintyLevel): DateValue | undefined {
  const day = p.day && p.day >= 1 && p.day <= 31 ? p.day : undefined;
  const month = p.month && p.month >= 1 && p.month <= 12 ? p.month : undefined;
  const year = p.year && p.year >= 1 && p.year <= 9999 ? p.year : undefined;

  if (!day && !month && !year) return undefined;
  if (year && month && day) return { value: `${year}-${pad(month)}-${pad(day)}`, certainty };
  if (year && month) return { monthYearOnly: `${year}-${pad(month)}`, certainty };
  if (year && !month) {
    if (day) return { displayText: `${day}, ${year}`, certainty };
    return { yearOnly: year, certainty };
  }
  if (month) {
    const txt = day ? `${MONTH_LABELS[month - 1]} ${day}` : MONTH_LABELS[month - 1];
    return { displayText: txt, certainty };
  }
  return undefined;
}

/** How specific a stored wedding-date ISO string is (3 = full date). */
export function weddingDatePrecision(iso?: string | null): number {
  if (!iso) return 0;
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return 3;
  if (/^\d{4}-\d{2}$/.test(iso)) return 2;
  if (/^\d{4}$/.test(iso)) return 1;
  return 0;
}
