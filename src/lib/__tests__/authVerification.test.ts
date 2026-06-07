import { describe, expect, it } from 'vitest';

import { isEmailNotConfirmedError } from '@/lib/authVerification';

describe('isEmailNotConfirmedError', () => {
  it('detects Supabase email-not-confirmed errors', () => {
    expect(isEmailNotConfirmedError(new Error('Email not confirmed'))).toBe(true);
    expect(isEmailNotConfirmedError(new Error('email_not_confirmed'))).toBe(true);
  });

  it('ignores other auth errors', () => {
    expect(isEmailNotConfirmedError(new Error('Invalid login credentials'))).toBe(false);
  });
});
