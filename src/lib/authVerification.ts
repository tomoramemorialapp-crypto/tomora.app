import { rawErrorMessage } from '@/lib/userErrors';

/** True when Supabase rejected sign-in because the address is not verified yet. */
export function isEmailNotConfirmedError(error: unknown): boolean {
  const raw = rawErrorMessage(error).toLowerCase();
  return raw.includes('email not confirmed') || raw.includes('email_not_confirmed');
}

export type ExistingSignupStatus =
  | 'new'
  | 'existing_unverified'
  | 'existing_password_mismatch'
  | 'existing_verified';
