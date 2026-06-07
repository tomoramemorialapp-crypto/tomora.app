import { describe, expect, it } from 'vitest';

import {
  dateValueToParts,
  dateValueToStorageIso,
  isoToDateValue,
  partsToDateValue,
} from '@/lib/dateValue';

describe('DateValueInput helpers', () => {
  it('round-trips a full wedding date', () => {
    const iso = '1990-06-15';
    const value = isoToDateValue(iso);
    expect(dateValueToStorageIso(value)).toBe(iso);
    expect(dateValueToParts(value)).toEqual({ year: 1990, month: 6, day: 15 });
  });

  it('keeps month and day when composing a full date from parts', () => {
    const value = partsToDateValue({ year: 1990, month: 6, day: 15 }, 'exact');
    expect(value?.value).toBe('1990-06-15');
  });

  it('does not collapse day+year into year-only', () => {
    const value = partsToDateValue({ year: 1990, day: 15 }, 'exact');
    expect(value?.yearOnly).toBeUndefined();
    expect(value?.displayText).toBe('15, 1990');
    expect(dateValueToStorageIso(value)).toBeNull();
  });
});
