import { describe, expect, it } from 'vitest';

import { parseAuthReturnParams, verifyOtpTypeFromUrl } from '../authCallbackSession';

describe('parseAuthReturnParams', () => {
  it('reads PKCE code from search params', () => {
    const params = parseAuthReturnParams('?code=abc123&next=onboarding', '');
    expect(params.code).toBe('abc123');
    expect(params.tokenHash).toBeNull();
  });

  it('reads token_hash for cross-browser email verification', () => {
    const params = parseAuthReturnParams(
      '?next=onboarding&token_hash=hash123&type=signup',
      '',
    );
    expect(params.tokenHash).toBe('hash123');
    expect(params.type).toBe('signup');
  });

  it('reads implicit-flow tokens from the hash fragment', () => {
    const params = parseAuthReturnParams(
      '?next=onboarding',
      '#access_token=at&refresh_token=rt&type=signup',
    );
    expect(params.accessToken).toBe('at');
    expect(params.refreshToken).toBe('rt');
    expect(params.type).toBe('signup');
  });

  it('decodes error descriptions from search or hash', () => {
    const params = parseAuthReturnParams('', '#error=invalid&error_description=Link+expired');
    expect(params.error).toBe('Link expired');
  });
});

describe('verifyOtpTypeFromUrl', () => {
  it('maps signup confirmation', () => {
    expect(verifyOtpTypeFromUrl('signup')).toBe('signup');
  });

  it('defaults unknown types to email', () => {
    expect(verifyOtpTypeFromUrl(null)).toBe('email');
  });
});
