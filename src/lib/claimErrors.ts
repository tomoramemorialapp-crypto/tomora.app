export type ClaimErrorCode =
  | 'NOT_SIGNED_IN'
  | 'INVALID_CODE'
  | 'ALREADY_CLAIMED'
  | 'BAD_PASSWORD'
  | 'INVITE_LOCKED'
  | 'INVITE_EXPIRED'
  | 'REVOKED';

export type InvitePreviewReason = ClaimErrorCode | 'INVALID_CODE';

const CLAIM_ERROR_MESSAGES: Record<ClaimErrorCode, string> = {
  NOT_SIGNED_IN: 'Please sign in or create your account first, then claim.',
  INVALID_CODE: 'We couldn’t find that invite code. Double-check it with the person who invited you.',
  ALREADY_CLAIMED: 'This profile has already been claimed. Ask the owner to transfer it to you instead.',
  BAD_PASSWORD: 'That password doesn’t match this invite.',
  INVITE_LOCKED: 'This invite is locked after too many wrong passwords. Ask for a new invite.',
  INVITE_EXPIRED: 'This invite has expired. Ask the person who invited you to send a fresh one.',
  REVOKED: 'This invite was revoked. Ask for a new invite link.',
};

const PREVIEW_REASON_MESSAGES: Partial<Record<InvitePreviewReason, string>> = {
  ALREADY_CLAIMED: CLAIM_ERROR_MESSAGES.ALREADY_CLAIMED,
  INVITE_LOCKED: CLAIM_ERROR_MESSAGES.INVITE_LOCKED,
  INVITE_EXPIRED: CLAIM_ERROR_MESSAGES.INVITE_EXPIRED,
  INVALID_CODE: 'Enter a valid invite code to see who saved a place for you.',
};

/** Map a Supabase/RPC error message to a friendly claim error. */
export function claimErrorMessage(raw: string): string {
  const key = (Object.keys(CLAIM_ERROR_MESSAGES) as ClaimErrorCode[]).find((k) => raw.includes(k));
  return key ? CLAIM_ERROR_MESSAGES[key] : 'We couldn’t complete the claim. Please try again.';
}

export function invitePreviewMessage(reason?: InvitePreviewReason): string {
  if (!reason) return PREVIEW_REASON_MESSAGES.INVALID_CODE!;
  return PREVIEW_REASON_MESSAGES[reason] ?? PREVIEW_REASON_MESSAGES.INVALID_CODE!;
}
