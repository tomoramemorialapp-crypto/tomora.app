/**
 * User-facing error messages and developer reference mapping.
 *
 * UI and services should call `userMessageFromError()` (or `formatCaughtError()`)
 * before showing errors. Never surface raw Supabase/Postgres/API strings to users.
 *
 * Developer dictionary: docs/USER_ERROR_REFERENCE.md
 */

import type { PostgrestError } from '@supabase/supabase-js';

import { claimErrorMessage } from '@/lib/claimErrors';

export type UserErrorContext =
  | 'auth'
  | 'media'
  | 'claim'
  | 'memorial'
  | 'account'
  | 'tree'
  | 'general';

export type UserErrorId =
  | 'auth.invalid_credentials'
  | 'auth.email_not_confirmed'
  | 'auth.email_already_registered'
  | 'auth.email_rate_limited'
  | 'auth.verification_link_expired'
  | 'auth.verification_link_pkce'
  | 'auth.email_send_failed'
  | 'auth.oauth_unavailable'
  | 'auth.session_failed'
  | 'auth.sign_in_cancelled'
  | 'auth.account_not_found'
  | 'auth.password_reset_expired'
  | 'auth.password_too_short'
  | 'auth.generic'
  | 'username.taken'
  | 'username.change_limit'
  | 'username.invalid'
  | 'username.reserved'
  | 'storage.quota_exceeded'
  | 'media.file_too_large'
  | 'media.unsupported_type'
  | 'media.upload_failed'
  | 'media.profile_photo_invalid'
  | 'permission.denied'
  | 'memorial.not_allowed'
  | 'memorial.not_found'
  | 'memorial.generic'
  | 'claim.generic'
  | 'database.schema_outdated'
  | 'general.unexpected'
  | 'general.network';

/** Copy shown in the product — calm, actionable, no internal jargon. */
export const USER_ERROR_MESSAGES: Record<UserErrorId, string> = {
  'auth.invalid_credentials': 'The email, username, or password is not correct.',
  'auth.email_not_confirmed':
    'Please confirm your email first. Check your inbox for the verification link, or request a new one.',
  'auth.email_already_registered':
    'An account with this email already exists. Try signing in instead, or use a different email.',
  'auth.email_rate_limited':
    'Too many emails were sent recently. Please wait a little while, then try again or check your spam folder.',
  'auth.verification_link_expired':
    'This verification link has expired or was already used. Request a new verification email below.',
  'auth.verification_link_pkce':
    'This verification link must be opened in the same browser where you signed up. Request a fresh link below — it will work in any browser.',
  'auth.email_send_failed':
    'We could not send the email right now. Please try again in a few minutes or check your spam folder.',
  'auth.oauth_unavailable':
    'Sign-in with this provider is not available right now. Try email and password instead.',
  'auth.session_failed': 'We could not start your session. Please try signing in again.',
  'auth.sign_in_cancelled': 'Sign-in was cancelled.',
  'auth.account_not_found': 'No account was found for that email or username.',
  'auth.password_reset_expired': 'Your reset link has expired. Request a new password reset email.',
  'auth.password_too_short': 'Use at least 8 characters for your password.',
  'auth.generic': 'We could not complete sign-in. Please try again.',
  'username.taken': 'That username is already taken. Try another one.',
  'username.change_limit': 'You can change your username at most twice every 30 days.',
  'username.invalid':
    'Username must be 3–30 characters: lowercase letters, numbers, and underscores only.',
  'username.reserved': 'That username is reserved.',
  'storage.quota_exceeded':
    'You have reached your storage limit. Remove some photos, memories, or uploads to free space.',
  'media.file_too_large': 'That file is too large for Tomora. Check the size limits and try a smaller file.',
  'media.unsupported_type':
    'That file type is not supported. Use a common photo, video, audio, or document format.',
  'media.upload_failed': 'We could not upload that file. Please try again.',
  'media.profile_photo_invalid':
    "This file can't be used as a profile photo. Please upload a JPG, PNG, or WebP image under 10MB.",
  'permission.denied': 'You do not have permission to do that.',
  'memorial.not_allowed': 'This memorial is private or the password is not correct.',
  'memorial.not_found': 'We could not find that memorial.',
  'memorial.generic': 'Something went wrong with this memorial. Please try again.',
  'claim.generic': 'We could not complete the claim. Please try again.',
  'database.schema_outdated':
    'Something went wrong on our side. Please try again in a few minutes.',
  'general.unexpected': 'Something went wrong. Please try again.',
  'general.network': 'We could not reach the server. Check your connection and try again.',
};

/**
 * Maps each user-facing error id to raw messages developers may see in logs,
 * Supabase responses, or RPC exceptions. See docs/USER_ERROR_REFERENCE.md.
 */
export const USER_ERROR_DEV_REFERENCE: Record<
  UserErrorId,
  { patterns: string[]; notes?: string }
> = {
  'auth.invalid_credentials': {
    patterns: ['Invalid login credentials', 'invalid_credentials'],
    notes: 'Supabase Auth — wrong email/username or password.',
  },
  'auth.email_not_confirmed': {
    patterns: ['Email not confirmed', 'email_not_confirmed'],
  },
  'auth.email_already_registered': {
    patterns: ['User already registered', 'already been registered', 'identities.length === 0'],
    notes: 'Sign-up returns empty identities when email exists.',
  },
  'auth.email_rate_limited': {
    patterns: ['rate limit', 'over_email_send_rate_limit', 'too many requests'],
  },
  'auth.verification_link_expired': {
    patterns: ['flow state', 'expired', 'invalid grant', 'already been used'],
  },
  'auth.verification_link_pkce': {
    patterns: ['PKCE code verifier not found', 'code verifier not found in storage'],
    notes: 'Email opened in a different browser than sign-up; web now uses implicit flow for new links.',
  },
  'auth.email_send_failed': {
    patterns: [
      'error sending confirmation mail',
      'error sending confirmation email',
      'email address not authorized',
    ],
    notes: 'Often missing custom SMTP in Supabase Auth settings.',
  },
  'auth.oauth_unavailable': {
    patterns: ['oauth', 'provider is not enabled', 'Unsupported provider'],
  },
  'auth.session_failed': {
    patterns: ['Could not start a session', 'Auth session missing'],
  },
  'auth.sign_in_cancelled': {
    patterns: ['Sign-in was cancelled', 'User cancelled'],
  },
  'auth.account_not_found': {
    patterns: ['No account found for that username', 'resolve_login_email returned null'],
  },
  'auth.password_reset_expired': {
    patterns: ['recovery link', 'otp_expired', 'token has expired'],
  },
  'auth.password_too_short': {
    patterns: ['Use at least 8 characters', 'Password should be at least'],
  },
  'auth.generic': { patterns: ['Unhandled AuthApiError'] },
  'username.taken': {
    patterns: ["That username isn't available", 'username_is_taken', 'duplicate key.*username'],
  },
  'username.change_limit': {
    patterns: ['at most twice every 30 days'],
  },
  'username.invalid': {
    patterns: ['Username must be 3–30 characters', 'Username must be 3-30 characters'],
  },
  'username.reserved': { patterns: ['That username is reserved', 'reserved username'] },
  'storage.quota_exceeded': {
    patterns: ['STORAGE_QUOTA_EXCEEDED', 'media storage limit'],
  },
  'media.file_too_large': {
    patterns: ['file too large', 'payload too large', 'entity too large', 'exceeded the maximum'],
  },
  'media.unsupported_type': {
    patterns: ['unsupported type', 'mime type', 'invalid file type', 'not allowed'],
  },
  'media.upload_failed': {
    patterns: ['upload failed', 'storage upload'],
  },
  'media.profile_photo_invalid': {
    patterns: ['unsupported_type', 'file_too_large', 'profile photo'],
  },
  'permission.denied': {
    patterns: ['42501', 'permission denied', 'not authorized', 'row-level security'],
  },
  'memorial.not_allowed': {
    patterns: ['NOT_ALLOWED', 'incorrect password', 'password_required'],
  },
  'memorial.not_found': {
    patterns: ['NODE_NOT_FOUND', 'REQUEST_NOT_FOUND', 'NOT_A_MEMORIAL'],
  },
  'memorial.generic': { patterns: ['memorial RPC errors'] },
  'claim.generic': {
    patterns: ['NOT_SIGNED_IN', 'INVALID_CODE', 'ALREADY_CLAIMED', 'BAD_PASSWORD', 'INVITE_LOCKED'],
    notes: 'See claimErrors.ts for full claim code mapping.',
  },
  'database.schema_outdated': {
    patterns: [
      'nodes_status_check',
      'relationship_type_check',
      'invalid input value for enum',
      'violates check constraint',
    ],
    notes: 'Apply pending migrations — npm run db:apply-pending',
  },
  'general.unexpected': { patterns: ['Unhandled technical errors'] },
  'general.network': {
    patterns: ['network request failed', 'failed to fetch', 'NetworkError', 'timeout'],
  },
};

const VALIDATION_MESSAGES = new Set<string>([
  USER_ERROR_MESSAGES['username.invalid'],
  USER_ERROR_MESSAGES['username.reserved'],
  USER_ERROR_MESSAGES['username.change_limit'],
  USER_ERROR_MESSAGES['username.taken'],
  USER_ERROR_MESSAGES['auth.password_too_short'],
  USER_ERROR_MESSAGES['media.profile_photo_invalid'],
  'Use at least 8 characters.',
  'Enter your email or username.',
  'Choose a username.',
]);

/** Extract a single string message from unknown thrown values. */
export function rawErrorMessage(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

function includesAny(haystack: string, needles: string[]): boolean {
  const lower = haystack.toLowerCase();
  return needles.some((n) => lower.includes(n.toLowerCase()));
}

/** True when a message looks like an internal/API error that should not be shown to users. */
export function looksLikeDeveloperMessage(message: string): boolean {
  const m = message.toLowerCase();
  if (!m.trim()) return false;
  if (VALIDATION_MESSAGES.has(message)) return false;

  return (
    m.includes('violates check constraint') ||
    m.includes('invalid input value for enum') ||
    m.includes('npm run') ||
    m.includes('migration') ||
    m.includes('postgrest') ||
    m.includes('pgrst') ||
    m.includes('jwt') ||
    m.includes('rpc error') ||
    m.includes('sqlstate') ||
    m.includes('duplicate key value') ||
    m.includes('foreign key constraint') ||
    m.includes('supabase') ||
    m.includes('stack trace') ||
    /^[A-Z_]{3,}(:\s|$)/.test(message)
  );
}

/** Resolve a known user-error id from a raw message. */
export function resolveUserErrorId(raw: string, context: UserErrorContext = 'general'): UserErrorId {
  const msg = raw.trim();
  if (!msg) return 'general.unexpected';

  if (VALIDATION_MESSAGES.has(msg)) {
    if (msg === USER_ERROR_MESSAGES['username.taken']) return 'username.taken';
    if (msg === USER_ERROR_MESSAGES['username.change_limit']) return 'username.change_limit';
    if (msg === USER_ERROR_MESSAGES['username.reserved']) return 'username.reserved';
    if (msg === USER_ERROR_MESSAGES['username.invalid']) return 'username.invalid';
    if (msg === USER_ERROR_MESSAGES['auth.password_too_short']) return 'auth.password_too_short';
    if (msg === USER_ERROR_MESSAGES['media.profile_photo_invalid']) return 'media.profile_photo_invalid';
  }

  const CLAIM_CODES = [
    'NOT_SIGNED_IN',
    'INVALID_CODE',
    'ALREADY_CLAIMED',
    'BAD_PASSWORD',
    'INVITE_LOCKED',
    'INVITE_EXPIRED',
    'REVOKED',
  ];
  if (context === 'claim' || CLAIM_CODES.some((c) => msg.includes(c))) {
    return 'claim.generic';
  }

  if (includesAny(msg, USER_ERROR_DEV_REFERENCE['auth.invalid_credentials'].patterns)) {
    return 'auth.invalid_credentials';
  }
  if (includesAny(msg, USER_ERROR_DEV_REFERENCE['auth.email_not_confirmed'].patterns)) {
    return 'auth.email_not_confirmed';
  }
  if (includesAny(msg, USER_ERROR_DEV_REFERENCE['auth.email_already_registered'].patterns)) {
    return 'auth.email_already_registered';
  }
  if (includesAny(msg, USER_ERROR_DEV_REFERENCE['auth.email_rate_limited'].patterns)) {
    return 'auth.email_rate_limited';
  }
  if (includesAny(msg, USER_ERROR_DEV_REFERENCE['auth.verification_link_pkce'].patterns)) {
    return 'auth.verification_link_pkce';
  }
  if (includesAny(msg, USER_ERROR_DEV_REFERENCE['auth.verification_link_expired'].patterns)) {
    return 'auth.verification_link_expired';
  }
  if (includesAny(msg, USER_ERROR_DEV_REFERENCE['auth.email_send_failed'].patterns)) {
    return 'auth.email_send_failed';
  }
  if (includesAny(msg, USER_ERROR_DEV_REFERENCE['auth.oauth_unavailable'].patterns)) {
    return 'auth.oauth_unavailable';
  }
  if (includesAny(msg, USER_ERROR_DEV_REFERENCE['auth.account_not_found'].patterns)) {
    return 'auth.account_not_found';
  }
  if (includesAny(msg, USER_ERROR_DEV_REFERENCE['auth.password_reset_expired'].patterns)) {
    return 'auth.password_reset_expired';
  }
  if (includesAny(msg, USER_ERROR_DEV_REFERENCE['auth.sign_in_cancelled'].patterns)) {
    return 'auth.sign_in_cancelled';
  }
  if (includesAny(msg, USER_ERROR_DEV_REFERENCE['storage.quota_exceeded'].patterns)) {
    return 'storage.quota_exceeded';
  }
  if (includesAny(msg, USER_ERROR_DEV_REFERENCE['media.file_too_large'].patterns)) {
    return 'media.file_too_large';
  }
  if (includesAny(msg, USER_ERROR_DEV_REFERENCE['media.unsupported_type'].patterns)) {
    return 'media.unsupported_type';
  }
  if (includesAny(msg, USER_ERROR_DEV_REFERENCE['permission.denied'].patterns)) {
    return 'permission.denied';
  }
  if (includesAny(msg, USER_ERROR_DEV_REFERENCE['database.schema_outdated'].patterns)) {
    return 'database.schema_outdated';
  }
  if (includesAny(msg, USER_ERROR_DEV_REFERENCE['general.network'].patterns)) {
    return 'general.network';
  }

  if (context === 'memorial' || includesAny(msg, ['NOT_A_MEMORIAL', 'memorial'])) {
    if (includesAny(msg, USER_ERROR_DEV_REFERENCE['memorial.not_allowed'].patterns)) {
      return 'memorial.not_allowed';
    }
    if (includesAny(msg, USER_ERROR_DEV_REFERENCE['memorial.not_found'].patterns)) {
      return 'memorial.not_found';
    }
    if (includesAny(msg, ['NOT_SIGNED_IN', 'NOT_A_MEMBER'])) {
      return 'memorial.generic';
    }
  }

  if (includesAny(msg, USER_ERROR_DEV_REFERENCE['username.taken'].patterns)) {
    return 'username.taken';
  }
  if (includesAny(msg, USER_ERROR_DEV_REFERENCE['username.change_limit'].patterns)) {
    return 'username.change_limit';
  }
  if (includesAny(msg, USER_ERROR_DEV_REFERENCE['username.reserved'].patterns)) {
    return 'username.reserved';
  }
  if (includesAny(msg, USER_ERROR_DEV_REFERENCE['username.invalid'].patterns)) {
    return 'username.invalid';
  }

  if (context === 'auth') return 'auth.generic';
  if (context === 'memorial') return 'memorial.generic';
  if (context === 'media') return 'media.upload_failed';

  if (looksLikeDeveloperMessage(msg)) return 'general.unexpected';

  return 'general.unexpected';
}

export function userMessageForId(id: UserErrorId): string {
  return USER_ERROR_MESSAGES[id];
}

/** Log the raw error in development for troubleshooting (never shown to users). */
export function logDeveloperError(error: unknown, context?: string): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  const raw = rawErrorMessage(error);
  const id = resolveUserErrorId(raw);
  const ref = USER_ERROR_DEV_REFERENCE[id];
  console.warn('[tomora:userError]', {
    context: context ?? 'general',
    userErrorId: id,
    userMessage: USER_ERROR_MESSAGES[id],
    rawMessage: raw,
    devPatterns: ref?.patterns,
    devNotes: ref?.notes,
    error,
  });
}

/** Map any thrown value to a safe user-facing string. */
export function userMessageFromError(
  error: unknown,
  fallback = USER_ERROR_MESSAGES['general.unexpected'],
  context: UserErrorContext = 'general',
): string {
  const raw = rawErrorMessage(error);
  if (!raw) return fallback;

  logDeveloperError(error, context);

  if (VALIDATION_MESSAGES.has(raw)) return raw;

  const CLAIM_CODES = [
    'NOT_SIGNED_IN',
    'INVALID_CODE',
    'ALREADY_CLAIMED',
    'BAD_PASSWORD',
    'INVITE_LOCKED',
    'INVITE_EXPIRED',
    'REVOKED',
  ];
  if (context === 'claim' || CLAIM_CODES.some((c) => raw.includes(c))) {
    return claimErrorMessage(raw);
  }

  if (context === 'memorial') {
    if (raw.includes('NOT_SIGNED_IN')) return 'Please sign in first.';
    if (raw.includes('NOT_A_MEMBER')) return 'You are not part of this family tree.';
    if (raw.includes('NODE_NOT_FOUND')) return USER_ERROR_MESSAGES['memorial.not_found'];
    if (raw.includes('NOT_A_MEMORIAL')) return 'This profile is not a memorial yet.';
    if (raw.includes('NOT_ALLOWED')) return USER_ERROR_MESSAGES['memorial.not_allowed'];
    if (raw.includes('REQUEST_NOT_FOUND')) return 'That request no longer exists.';
  }

  if (context === 'memorial' || includesAny(raw, ['incorrect password', 'password_required'])) {
    if (includesAny(raw, ['incorrect password'])) return "That password didn't work.";
    if (includesAny(raw, ['password_required'])) return 'Enter the password to view this memory.';
  }

  const id = resolveUserErrorId(raw, context);
  return USER_ERROR_MESSAGES[id] ?? fallback;
}

/** Use in UI catch blocks — logs for developers, returns safe copy for users. */
export function formatCaughtError(
  error: unknown,
  fallback = USER_ERROR_MESSAGES['general.unexpected'],
  context: UserErrorContext = 'general',
): string {
  return userMessageFromError(error, fallback, context);
}

/** Turn PostgREST/Postgres errors into user-facing messages (never expose schema details). */
export function userMessageFromSupabaseError(
  error: PostgrestError | null | undefined,
  fallback: string,
): string {
  if (!error) return fallback;
  logDeveloperError(error, 'supabase');
  return userMessageFromError(error, fallback, 'general');
}

/** @deprecated Use userMessageFromError(error, fallback, 'auth') */
export function friendlyAuthError(error: unknown): string {
  return userMessageFromError(error, USER_ERROR_MESSAGES['auth.generic'], 'auth');
}

/** @deprecated Use userMessageFromError(error, fallback, 'memorial') */
export function friendlyMemorialError(message: string): string {
  return userMessageFromError(message, USER_ERROR_MESSAGES['memorial.generic'], 'memorial');
}

/** @deprecated Use userMessageFromError(error, fallback, 'general') */
export function friendlyPublicMemoryUnlockError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('incorrect password')) return "That password didn't work.";
  if (m.includes('password_required')) return 'Enter the password to view this memory.';
  if (m.includes('not on a public profile') || m.includes('not shared publicly')) {
    return 'This memory is no longer available on this profile.';
  }
  if (m.includes('memory not found')) return 'This memory is no longer available.';
  return userMessageFromError(message, 'Could not open this memory. Please try again.', 'general');
}
