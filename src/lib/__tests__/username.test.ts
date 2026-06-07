import { describe, expect, it } from 'vitest';

import {
  isEmailIdentifier,
  isUsernameIdentifier,
  normalizeUsername,
  validateUsername,
} from '@/lib/username';

describe('normalizeUsername', () => {
  it('lowercases and strips invalid characters', () => {
    expect(normalizeUsername('Tom_Ora-1')).toBe('tom_ora1');
  });
});

describe('validateUsername', () => {
  it('accepts valid handles', () => {
    expect(validateUsername('mara_lee')).toBeNull();
    expect(validateUsername('user_42')).toBeNull();
  });

  it('rejects reserved handles', () => {
    expect(validateUsername('tomora')).toBe('That username is reserved.');
    expect(validateUsername('admin')).toBe('That username is reserved.');
  });

  it('rejects too short or invalid characters', () => {
    expect(validateUsername('ab')).not.toBeNull();
    expect(validateUsername('bad-handle')).not.toBeNull();
  });
});

describe('login identifiers', () => {
  it('detects emails', () => {
    expect(isEmailIdentifier('you@example.com')).toBe(true);
    expect(isEmailIdentifier('username')).toBe(false);
  });

  it('detects usernames', () => {
    expect(isUsernameIdentifier('mara_lee')).toBe(true);
    expect(isUsernameIdentifier('ab')).toBe(false);
  });
});
