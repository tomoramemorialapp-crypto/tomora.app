import { describe, expect, it } from 'vitest';
import type { PostgrestError } from '@supabase/supabase-js';

import {
  formatCaughtError,
  looksLikeDeveloperMessage,
  resolveUserErrorId,
  userMessageFromError,
  USER_ERROR_MESSAGES,
} from '@/lib/userErrors';
import { userMessageFromSupabaseError } from '@/lib/supabaseErrors';

describe('userMessageFromError', () => {
  it('maps invalid login credentials to friendly copy', () => {
    expect(userMessageFromError(new Error('Invalid login credentials'), '', 'auth')).toBe(
      USER_ERROR_MESSAGES['auth.invalid_credentials'],
    );
  });

  it('maps PKCE verifier errors to friendly copy', () => {
    expect(
      userMessageFromError(
        new Error('PKCE code verifier not found in storage'),
        '',
        'auth',
      ),
    ).toBe(USER_ERROR_MESSAGES['auth.verification_link_pkce']);
  });

  it('maps storage quota errors', () => {
    expect(userMessageFromError(new Error('STORAGE_QUOTA_EXCEEDED'), '', 'media')).toBe(
      USER_ERROR_MESSAGES['storage.quota_exceeded'],
    );
  });

  it('maps username taken from RPC', () => {
    expect(userMessageFromError(new Error("That username isn't available."), '', 'account')).toBe(
      USER_ERROR_MESSAGES['username.taken'],
    );
  });

  it('hides raw SMTP errors from users', () => {
    const msg = userMessageFromError(
      new Error('Error sending confirmation email — configure SMTP in Supabase'),
      '',
      'auth',
    );
    expect(msg).toBe(USER_ERROR_MESSAGES['auth.email_send_failed']);
    expect(msg.toLowerCase()).not.toContain('supabase');
  });

  it('hides technical postgres errors', () => {
    expect(
      userMessageFromError(
        new Error('new row violates check constraint "relationships_relationship_type_check"'),
        '',
        'general',
      ),
    ).toBe(USER_ERROR_MESSAGES['database.schema_outdated']);
  });

  it('preserves client validation copy', () => {
    expect(userMessageFromError(new Error('Use at least 8 characters.'), '', 'auth')).toBe(
      'Use at least 8 characters.',
    );
  });
});

describe('formatCaughtError', () => {
  it('returns fallback for unknown non-technical errors when unmatched', () => {
    expect(formatCaughtError(new Error('Something odd'), 'Custom fallback', 'general')).toBe(
      USER_ERROR_MESSAGES['general.unexpected'],
    );
  });
});

describe('looksLikeDeveloperMessage', () => {
  it('flags migration and constraint messages', () => {
    expect(looksLikeDeveloperMessage('Apply migration 20260606180000')).toBe(true);
    expect(looksLikeDeveloperMessage('violates check constraint')).toBe(true);
  });

  it('does not flag user validation strings', () => {
    expect(looksLikeDeveloperMessage(USER_ERROR_MESSAGES['username.taken'])).toBe(false);
  });
});

describe('resolveUserErrorId', () => {
  it('classifies permission denied', () => {
    expect(resolveUserErrorId('permission denied for table nodes')).toBe('permission.denied');
  });
});

describe('userMessageFromSupabaseError', () => {
  it('hides schema migration details from users', () => {
    const msg = userMessageFromSupabaseError(
      {
        message: 'new row violates check constraint "relationships_relationship_type_check"',
        details: '',
        hint: '',
        code: '23514',
      } as PostgrestError,
      'fallback',
    );
    expect(msg).not.toContain('migration');
    expect(msg).not.toContain('20260606170000');
    expect(msg).toBe(USER_ERROR_MESSAGES['database.schema_outdated']);
  });

  it('maps permission errors', () => {
    const msg = userMessageFromSupabaseError(
      { message: 'permission denied', details: '', hint: '', code: '42501' } as PostgrestError,
      'fallback',
    );
    expect(msg).toBe(USER_ERROR_MESSAGES['permission.denied']);
  });
});
