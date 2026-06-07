import { describe, expect, it } from 'vitest';
import type { Session } from '@supabase/supabase-js';

import {
  emptyOnboardingDraft,
  hasOnboardingTreeDraft,
  isLikelyAutoDisplayName,
  mergeOnboardingDrafts,
  parseOnboardingDraftFromMeta,
  resolveOnboardingDraft,
} from '@/lib/onboardingDraft';

describe('onboardingDraft', () => {
  it('detects when a draft can seed a tree', () => {
    expect(hasOnboardingTreeDraft(emptyOnboardingDraft())).toBe(false);
    expect(hasOnboardingTreeDraft({ ...emptyOnboardingDraft(), lovedOneName: 'Mia' })).toBe(true);
  });

  it('merges local and remote drafts preferring filled strings', () => {
    const local = { ...emptyOnboardingDraft(), selfName: 'Alex', lovedOneName: 'Mia' };
    const remote = { ...emptyOnboardingDraft(), selfName: '', lovedOneName: 'Mia', pendingUsername: 'alex' };
    expect(mergeOnboardingDrafts(local, remote)).toMatchObject({
      selfName: 'Alex',
      lovedOneName: 'Mia',
      pendingUsername: 'alex',
    });
  });

  it('parses onboarding draft from auth metadata', () => {
    const parsed = parseOnboardingDraftFromMeta({
      selfName: 'Alex',
      lovedOneName: 'Buddy',
      lovedOneRelationship: 'pet',
      lovedOneIsRemembered: false,
    });
    expect(parsed?.selfName).toBe('Alex');
    expect(parsed?.lovedOneRelationship).toBe('pet');
  });

  it('resolves draft from session metadata when local storage is empty', () => {
    const resolved = resolveOnboardingDraft(emptyOnboardingDraft(), {
      user: {
        user_metadata: {
          onboarding_draft: {
            selfName: 'Alex',
            lovedOneName: 'Buddy',
            lovedOneRelationship: 'pet',
          },
        },
      },
    } as unknown as Session);
    expect(resolved.selfName).toBe('Alex');
    expect(resolved.lovedOneName).toBe('Buddy');
  });

  it('flags email-shaped default display names', () => {
    expect(isLikelyAutoDisplayName('You', 'alex@example.com')).toBe(true);
    expect(isLikelyAutoDisplayName('alex', 'alex@example.com')).toBe(true);
    expect(isLikelyAutoDisplayName('Alexander', 'alex@example.com')).toBe(false);
  });
});
