import type { SupabaseClient } from '@supabase/supabase-js';

export type AuthReturnParams = {
  code: string | null;
  tokenHash: string | null;
  type: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
};

/** Parse Supabase auth params from a callback URL search string and hash fragment. */
export function parseAuthReturnParams(searchRaw: string, hashRaw: string): AuthReturnParams {
  const search = new URLSearchParams(searchRaw.replace(/^\?/, ''));
  const hash = new URLSearchParams(hashRaw.replace(/^#/, ''));

  const pick = (key: string) => search.get(key) ?? hash.get(key);

  return {
    code: pick('code'),
    tokenHash: pick('token_hash'),
    type: pick('type'),
    accessToken: pick('access_token'),
    refreshToken: pick('refresh_token'),
    error: pick('error_description') ?? pick('error'),
  };
}

function decodeAuthError(description: string | null): string | null {
  if (!description) return null;
  return description.replace(/\+/g, ' ');
}

export type VerifyOtpType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email';

/** Map URL `type` query values to Supabase verifyOtp types. */
export function verifyOtpTypeFromUrl(type: string | null): VerifyOtpType {
  switch (type) {
    case 'signup':
      return 'signup';
    case 'recovery':
      return 'recovery';
    case 'invite':
      return 'invite';
    case 'magiclink':
      return 'magiclink';
    case 'email_change':
      return 'email_change';
    default:
      return 'email';
  }
}

async function waitForSession(
  getSession: () => Promise<unknown | null>,
  attempts = 12,
  delayMs = 250,
): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    const session = await getSession();
    if (session) return true;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

function isPkceVerifierMissing(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('pkce') && lower.includes('code verifier');
}

export class AuthCallbackSessionError extends Error {
  constructor(
    message: string,
    readonly code: 'url_error' | 'pkce_missing' | 'expired' | 'unknown' = 'unknown',
  ) {
    super(message);
    this.name = 'AuthCallbackSessionError';
  }
}

/**
 * Complete sign-in from Supabase email / OAuth return URL parameters.
 *
 * Web email links often open in a different browser than sign-up (mail apps, mobile
 * handoff). PKCE `?code=` exchange requires the original verifier, so we prefer:
 * 1. token_hash + verifyOtp (works anywhere)
 * 2. implicit hash tokens (detectSessionInUrl)
 * 3. PKCE code exchange (same browser only)
 */
export async function completeSessionFromAuthReturn(
  supabase: SupabaseClient,
  params: AuthReturnParams,
): Promise<void> {
  const urlError = decodeAuthError(params.error);
  if (urlError) {
    throw new AuthCallbackSessionError(urlError, 'url_error');
  }

  if (params.tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: params.tokenHash,
      type: verifyOtpTypeFromUrl(params.type),
    });
    if (error) throw new AuthCallbackSessionError(error.message, 'expired');
    return;
  }

  const hasImplicitTokens = Boolean(params.accessToken || params.refreshToken);
  if (hasImplicitTokens) {
    const ok = await waitForSession(async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    });
    if (!ok) {
      throw new AuthCallbackSessionError(
        'We couldn’t finish signing you in from this link. Please request a new verification email.',
        'expired',
      );
    }
    return;
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) {
      if (isPkceVerifierMissing(error.message)) {
        const recovered = await waitForSession(async () => {
          const { data } = await supabase.auth.getSession();
          return data.session;
        });
        if (recovered) return;

        throw new AuthCallbackSessionError(
          'This verification link must be opened in the same browser where you signed up, or you can request a fresh link below.',
          'pkce_missing',
        );
      }
      throw new AuthCallbackSessionError(error.message, 'expired');
    }
    return;
  }

  // No explicit params — detectSessionInUrl may still be processing hash tokens.
  await waitForSession(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }, 4, 250);
}
