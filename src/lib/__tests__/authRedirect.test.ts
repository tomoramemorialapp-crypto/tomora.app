import { describe, expect, it } from 'vitest';

import { getSupabaseAuthRedirectAllowList } from '@/lib/authConfig';

describe('authConfig redirect allow list', () => {
  it('lists production callback URLs for the Supabase allow list', () => {
    const urls = getSupabaseAuthRedirectAllowList();
    expect(urls).toContain('https://tomora.app/auth/callback');
    expect(urls).toContain('https://tomora.app/auth/callback?next=reset-password');
    expect(urls).toContain('https://tomora.app/**');
    expect(urls).toContain('http://localhost:8081/auth/callback');
  });
});
