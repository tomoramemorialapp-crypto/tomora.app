import { describe, expect, it } from 'vitest';

import { canViewContent } from '@/lib/visibility';
import type { Account } from '@/types/models';

const viewer: Account = {
  id: 'acct-1',
  displayName: 'You',
  email: 'you@example.com',
  language: 'en',
  themePreference: 'system',
  socialLinks: {},
  publicProfile: { enabled: false, showSocial: true, showMemories: true, showLifeProfile: true },
  usernameChanges: [],
  status: 'active',
  createdAt: '',
  updatedAt: '',
};

describe('canViewContent', () => {
  it('allows public content for guests', () => {
    expect(
      canViewContent({
        viewer: null,
        content: { visibility: 'public', createdByAccountId: 'other' },
      }),
    ).toBe(true);
  });

  it('blocks private content from other members', () => {
    expect(
      canViewContent({
        viewer,
        content: { visibility: 'private', createdByAccountId: 'other' },
        familyTreeMembership: { role: 'member' },
      }),
    ).toBe(false);
  });

  it('allows creators to see their own private content', () => {
    expect(
      canViewContent({
        viewer,
        content: { visibility: 'private', createdByAccountId: viewer.id },
      }),
    ).toBe(true);
  });

  it('allows family_tree content for tree members', () => {
    expect(
      canViewContent({
        viewer,
        content: { visibility: 'family_tree', createdByAccountId: 'other' },
        familyTreeMembership: { role: 'member' },
      }),
    ).toBe(true);
  });

  it('blocks family_tree content for signed-out viewers', () => {
    expect(
      canViewContent({
        viewer: null,
        content: { visibility: 'family_tree', createdByAccountId: 'other' },
      }),
    ).toBe(false);
  });
});
