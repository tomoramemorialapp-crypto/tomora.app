import { describe, expect, it } from 'vitest';
import {
  formatPreviousNameEntry,
  previousNamesFromProfile,
  previousNamesToProfile,
} from '../previousNames';

describe('previousNames', () => {
  it('round-trips profile entries', () => {
    const stored = [
      {
        id: 'pn-1',
        name: 'García',
        type: 'maiden_name' as const,
        fromDate: '1960',
        toDate: '1985',
        notes: 'Before marriage',
      },
    ];
    const drafts = previousNamesFromProfile(stored);
    expect(drafts[0].name).toBe('García');
    expect(previousNamesToProfile(drafts)).toEqual(stored);
  });

  it('drops blank name rows', () => {
    expect(previousNamesToProfile([{ id: 'a', name: '  ', type: '', notes: '' }])).toEqual([]);
  });

  it('formats an entry for display', () => {
    expect(
      formatPreviousNameEntry({
        id: 'pn-1',
        name: 'Smith',
        type: 'maiden_name',
        fromDate: '1942',
        toDate: '1968',
      }),
    ).toContain('Smith');
    expect(
      formatPreviousNameEntry({
        id: 'pn-1',
        name: 'Smith',
        type: 'maiden_name',
        fromDate: '1942',
        toDate: '1968',
      }),
    ).toContain('Maiden name');
  });
});
