import type { Session } from '@supabase/supabase-js';

import type { RelationshipDetail } from '@/lib/relationshipDetail';
import type { RelationshipType } from '@/types/models';

export const ONBOARDING_DRAFT_STORAGE_KEY = 'tomora.onboarding.draft';
export const ONBOARDING_DRAFT_META_KEY = 'onboarding_draft';

export interface OnboardingDraft {
  selfName: string;
  lovedOneName: string;
  lovedOneRelationship: RelationshipType;
  lovedOneRelationshipDetail?: RelationshipDetail;
  lovedOneTaxonId?: string;
  lovedOneIsRemembered: boolean;
  /** Chosen at signup; applied via set_username once a session exists. */
  pendingUsername?: string;
  /** Invite code to auto-claim after the user creates an account. */
  pendingClaimCode?: string;
  /** Claim password stored locally until auth completes (never in URL). */
  pendingClaimPassword?: string;
}

export const emptyOnboardingDraft = (): OnboardingDraft => ({
  selfName: '',
  lovedOneName: '',
  lovedOneRelationship: 'parent',
  lovedOneIsRemembered: false,
});

/** Whether the draft contains enough data to seed the first Family Tree. */
export function hasOnboardingTreeDraft(draft: OnboardingDraft): boolean {
  return draft.lovedOneName.trim().length > 0;
}

export function loadOnboardingDraftFromStorage(): OnboardingDraft {
  if (typeof localStorage === 'undefined') return emptyOnboardingDraft();
  try {
    const raw = localStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY);
    return raw ? { ...emptyOnboardingDraft(), ...JSON.parse(raw) } : emptyOnboardingDraft();
  } catch {
    return emptyOnboardingDraft();
  }
}

export function storeOnboardingDraftToStorage(draft: OnboardingDraft): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(ONBOARDING_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // ignore storage failures
  }
}

export function clearOnboardingDraftStorage(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function pickString(a?: string, b?: string): string | undefined {
  if (a?.trim()) return a.trim();
  if (b?.trim()) return b.trim();
  return a ?? b;
}

/** Prefer whichever side has the richer onboarding data (local wins on ties). */
export function mergeOnboardingDrafts(local: OnboardingDraft, remote: OnboardingDraft): OnboardingDraft {
  return {
    selfName: pickString(local.selfName, remote.selfName) ?? '',
    lovedOneName: pickString(local.lovedOneName, remote.lovedOneName) ?? '',
    lovedOneRelationship: local.lovedOneRelationship || remote.lovedOneRelationship,
    lovedOneRelationshipDetail: local.lovedOneRelationshipDetail ?? remote.lovedOneRelationshipDetail,
    lovedOneTaxonId: local.lovedOneTaxonId ?? remote.lovedOneTaxonId,
    lovedOneIsRemembered: local.lovedOneIsRemembered || remote.lovedOneIsRemembered,
    pendingUsername: pickString(local.pendingUsername, remote.pendingUsername),
    pendingClaimCode: pickString(local.pendingClaimCode, remote.pendingClaimCode),
    pendingClaimPassword: local.pendingClaimPassword ?? remote.pendingClaimPassword,
  };
}

export function parseOnboardingDraftFromMeta(value: unknown): OnboardingDraft | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const lovedOneName = typeof row.lovedOneName === 'string' ? row.lovedOneName : '';
  if (!lovedOneName.trim()) return null;
  return {
    ...emptyOnboardingDraft(),
    selfName: typeof row.selfName === 'string' ? row.selfName : '',
    lovedOneName,
    lovedOneRelationship:
      typeof row.lovedOneRelationship === 'string'
        ? (row.lovedOneRelationship as RelationshipType)
        : 'parent',
    lovedOneRelationshipDetail:
      typeof row.lovedOneRelationshipDetail === 'string'
        ? (row.lovedOneRelationshipDetail as RelationshipDetail)
        : undefined,
    lovedOneTaxonId: typeof row.lovedOneTaxonId === 'string' ? row.lovedOneTaxonId : undefined,
    lovedOneIsRemembered: row.lovedOneIsRemembered === true,
    pendingUsername: typeof row.pendingUsername === 'string' ? row.pendingUsername : undefined,
    pendingClaimCode: typeof row.pendingClaimCode === 'string' ? row.pendingClaimCode : undefined,
    pendingClaimPassword:
      typeof row.pendingClaimPassword === 'string' ? row.pendingClaimPassword : undefined,
  };
}

export function resolveOnboardingDraft(local: OnboardingDraft, session: Session | null): OnboardingDraft {
  const fromMeta = parseOnboardingDraftFromMeta(session?.user.user_metadata?.[ONBOARDING_DRAFT_META_KEY]);
  if (!fromMeta) return local;
  return mergeOnboardingDrafts(local, fromMeta);
}

export function serializeOnboardingDraftForMeta(draft: OnboardingDraft): Record<string, unknown> {
  return {
    selfName: draft.selfName,
    lovedOneName: draft.lovedOneName,
    lovedOneRelationship: draft.lovedOneRelationship,
    lovedOneRelationshipDetail: draft.lovedOneRelationshipDetail ?? null,
    lovedOneTaxonId: draft.lovedOneTaxonId ?? null,
    lovedOneIsRemembered: draft.lovedOneIsRemembered,
    pendingUsername: draft.pendingUsername ?? null,
    pendingClaimCode: draft.pendingClaimCode ?? null,
    pendingClaimPassword: draft.pendingClaimPassword ?? null,
  };
}

/** True when the account display name looks like a default from auth email, not onboarding. */
export function isLikelyAutoDisplayName(displayName: string, email?: string | null): boolean {
  const trimmed = displayName.trim();
  if (!trimmed || trimmed === 'You') return true;
  if (!email) return false;
  const lower = trimmed.toLowerCase();
  const emailLower = email.toLowerCase();
  if (lower === emailLower) return true;
  const local = emailLower.split('@')[0];
  return local.length > 0 && lower === local;
}
