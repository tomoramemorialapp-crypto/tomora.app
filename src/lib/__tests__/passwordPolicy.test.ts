import { describe, expect, it } from 'vitest';

import {
  PASSWORD_MIN_LENGTH,
  passwordMeetsMinLength,
  passwordMinLengthHint,
  validatePasswordLength,
} from '@/lib/passwordPolicy';

describe('passwordPolicy', () => {
  it('uses a single minimum length everywhere', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
  });

  it('rejects short passwords', () => {
    expect(passwordMeetsMinLength('1234567')).toBe(false);
    expect(validatePasswordLength('1234567')).toMatch(/8/);
  });

  it('accepts passwords at the minimum length', () => {
    expect(passwordMeetsMinLength('12345678')).toBe(true);
    expect(validatePasswordLength('12345678')).toBeNull();
  });

  it('formats the UI hint', () => {
    expect(passwordMinLengthHint()).toBe('At least 8 characters');
  });
});
