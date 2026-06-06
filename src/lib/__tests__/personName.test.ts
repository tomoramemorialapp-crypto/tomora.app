import { describe, expect, it } from 'vitest';
import {
  formatPersonName,
  isPersonNameEmpty,
  parsePersonNameFromString,
  personNameSearchHaystack,
  profileToFlatColumns,
  resolvePersonName,
} from '@/lib/profile';
import type { NodeProfile } from '@/types/profile';

describe('parsePersonNameFromString', () => {
  it('splits a typical western name', () => {
    expect(parsePersonNameFromString('Maria Elena Santos Jr.')).toEqual({
      firstName: 'Maria',
      middleName: 'Elena',
      surname: 'Santos',
      suffix: 'Jr.',
    });
  });

  it('handles a single given name', () => {
    expect(parsePersonNameFromString('Madonna')).toEqual({ firstName: 'Madonna' });
  });
});

describe('formatPersonName', () => {
  it('joins populated parts', () => {
    expect(
      formatPersonName({ firstName: 'Jose', middleName: 'Antonio', surname: 'Reyes', suffix: 'III' }),
    ).toBe('Jose Antonio Reyes III');
  });
});

describe('resolvePersonName', () => {
  it('migrates legacy fullName strings', () => {
    const profile = {
      fullName: {
        value: 'Ana Lopez',
        visibility: 'family_tree',
        status: 'confirmed',
        source: { sourceType: 'guardian' },
        lastEditedByAccountId: 'a1',
        lastEditedAt: '2026-01-01',
      },
    } as NodeProfile;
    expect(resolvePersonName(profile)).toEqual({ firstName: 'Ana', surname: 'Lopez' });
  });
});

describe('profileToFlatColumns', () => {
  it('syncs display_name from structured name', () => {
    const profile: NodeProfile = {
      name: {
        value: { firstName: 'Luis', surname: 'Garcia' },
        visibility: 'family_tree',
        status: 'confirmed',
        source: { sourceType: 'guardian' },
        lastEditedByAccountId: 'a1',
        lastEditedAt: '2026-01-01',
      },
    };
    expect(profileToFlatColumns(profile).display_name).toBe('Luis Garcia');
  });
});

describe('personNameSearchHaystack', () => {
  it('includes all parts for tree search', () => {
    expect(personNameSearchHaystack({ firstName: 'Ana', surname: 'Cruz' })).toBe('ana cruz');
  });
});

describe('isPersonNameEmpty', () => {
  it('detects blank names', () => {
    expect(isPersonNameEmpty({ firstName: '', surname: '' })).toBe(true);
    expect(isPersonNameEmpty({ firstName: 'Ana' })).toBe(false);
  });
});
