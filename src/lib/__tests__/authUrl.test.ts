import { describe, expect, it } from 'vitest';

import { getSupabaseAuthRedirectAllowList } from '../authConfig';

describe('Supabase auth redirect allow list', () => {
  it('lists production and dev callback URLs for the dashboard', () => {
    const urls = getSupabaseAuthRedirectAllowList();
    expect(urls).toContain('https://tomora.app/auth/callback');
    expect(urls).toContain('https://tomora.app/auth/callback?next=onboarding');
    expect(urls).toContain('https://tomora.app/auth/callback?next=claim');
    expect(urls).toContain('https://tomora.app/auth/callback?next=reset-password');
    expect(urls).toContain('https://tomora.app/**');
    expect(urls).toContain('http://localhost:8081/auth/callback');
    expect(urls).toContain('http://localhost:3000/auth/callback');
  });
});
