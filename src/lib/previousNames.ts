import type { DateValue, PreviousName, PreviousNameType } from '@/types/profile';
import { formatDateValue } from './profile';

function isoToDateValue(iso: string): DateValue | undefined {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return { value: iso, certainty: 'exact' };
  if (/^\d{4}-\d{2}$/.test(iso)) return { monthYearOnly: iso, certainty: 'exact' };
  if (/^\d{4}$/.test(iso)) return { yearOnly: Number(iso), certainty: 'exact' };
  return undefined;
}

function dateValueToStorageIso(d?: DateValue): string | null {
  if (!d) return null;
  if (d.value) return d.value;
  if (d.monthYearOnly) return d.monthYearOnly;
  if (d.yearOnly) return String(d.yearOnly);
  return null;
}

export const PREVIOUS_NAME_TYPE_OPTIONS: { id: PreviousNameType; label: string }[] = [
  { id: 'maiden_name', label: 'Maiden name' },
  { id: 'married_name', label: 'Married name' },
  { id: 'legal_change', label: 'Legal name change' },
  { id: 'adopted_name', label: 'Adopted name' },
  { id: 'alternate_spelling', label: 'Alternate spelling' },
  { id: 'romanization', label: 'Romanization' },
  { id: 'other', label: 'Other' },
];

const TYPE_LABEL: Record<PreviousNameType, string> = Object.fromEntries(
  PREVIOUS_NAME_TYPE_OPTIONS.map((o) => [o.id, o.label]),
) as Record<PreviousNameType, string>;

export type PreviousNameDraft = {
  id: string;
  name: string;
  type: PreviousNameType | '';
  fromDate?: DateValue;
  toDate?: DateValue;
  notes: string;
};

export function newPreviousNameDraft(): PreviousNameDraft {
  return {
    id: `pn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    type: '',
    notes: '',
  };
}

function storageToDateValue(raw?: string): DateValue | undefined {
  if (!raw?.trim()) return undefined;
  return isoToDateValue(raw.trim()) ?? { displayText: raw.trim(), certainty: 'approximate' };
}

function dateValueToStorage(d?: DateValue): string | undefined {
  if (!d) return undefined;
  const iso = dateValueToStorageIso(d);
  if (iso) return iso;
  const text = formatDateValue(d);
  return text || undefined;
}

export function previousNamesFromProfile(values?: PreviousName[]): PreviousNameDraft[] {
  return (values ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type ?? '',
    fromDate: storageToDateValue(p.fromDate),
    toDate: storageToDateValue(p.toDate),
    notes: p.notes ?? '',
  }));
}

export function previousNamesToProfile(drafts: PreviousNameDraft[]): PreviousName[] {
  const out: PreviousName[] = [];
  for (const d of drafts) {
    const name = d.name.trim();
    if (!name) continue;
    out.push({
      id: d.id,
      name,
      type: d.type || undefined,
      fromDate: dateValueToStorage(d.fromDate),
      toDate: dateValueToStorage(d.toDate),
      notes: d.notes.trim() || undefined,
    });
  }
  return out;
}

export function formatPreviousNameEntry(entry: PreviousName): string {
  const bits = [entry.name];
  if (entry.type) bits.push(TYPE_LABEL[entry.type]);
  const range = [entry.fromDate, entry.toDate].filter(Boolean).join(' – ');
  if (range) bits.push(range);
  if (entry.notes) bits.push(entry.notes);
  return bits.join(' · ');
}

export function formatPreviousNamesList(values?: PreviousName[]): string {
  if (!values?.length) return '';
  return values.map(formatPreviousNameEntry).join('\n');
}
