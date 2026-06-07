# User error reference (developers)

Tomora shows **calm, user-facing copy** in the product. Raw Supabase, Postgres, and API errors are logged in development only (`__DEV__`) via `logDeveloperError()` in `src/lib/userErrors.ts`.

Use `userMessageFromError()` or `formatCaughtError()` before displaying errors in UI.

## Quick lookup

| User sees | `UserErrorId` | Typical raw / log signals |
|-----------|---------------|---------------------------|
| The email, username, or password is not correct. | `auth.invalid_credentials` | `Invalid login credentials` |
| Please confirm your email first… | `auth.email_not_confirmed` | `Email not confirmed` — use login resend panel |
| An account with this email already exists… | `auth.email_already_registered` | Duplicate sign-up / `User already registered` |
| Too many emails were sent recently… | `auth.email_rate_limited` | `over_email_send_rate_limit`, rate limit |
| This verification link has expired… | `auth.verification_link_expired` | `invalid grant`, flow state expired |
| This verification link must be opened in the same browser… | `auth.verification_link_pkce` | `PKCE code verifier not found in storage` |
| We could not send the email right now… | `auth.email_send_failed` | `error sending confirmation mail`, SMTP / unauthorized email |
| Sign-in with this provider is not available… | `auth.oauth_unavailable` | OAuth provider disabled in Supabase |
| No account was found for that email or username. | `auth.account_not_found` | `resolve_login_email` empty |
| Your reset link has expired… | `auth.password_reset_expired` | OTP / recovery token expired |
| That username is already taken… | `username.taken` | `That username isn't available` |
| You can change your username at most twice… | `username.change_limit` | RPC `set_username` change limit |
| You have reached your storage limit… | `storage.quota_exceeded` | `STORAGE_QUOTA_EXCEEDED` |
| That file is too large for Tomora… | `media.file_too_large` | Payload / entity too large |
| That file type is not supported… | `media.unsupported_type` | MIME / type rejection |
| This file can't be used as a profile photo… | `media.profile_photo_invalid` | `profilePhotoValidation` |
| You do not have permission to do that. | `permission.denied` | Postgres `42501`, RLS |
| Something went wrong on our side… | `database.schema_outdated` | Check constraint, enum, missing migration |
| Something went wrong. Please try again. | `general.unexpected` | Unmatched technical messages |

## Unverified account recovery

When sign-up detects a duplicate email (`identities.length === 0`), the app probes sign-in:

| Probe result | User experience |
|--------------|-----------------|
| `existing_unverified` | “Account almost ready” screen + auto-resend verification email |
| `existing_password_mismatch` | Prompt to sign in or reset password |
| `existing_verified` | Session created — onboarding continues |

Login with an unverified account shows the resend verification panel instead of a dead-end error.


Claim flows use `src/lib/claimErrors.ts`. Raw RPC codes map to user copy:

| Code | User message |
|------|----------------|
| `INVALID_CODE` | We couldn't find that invite code… |
| `ALREADY_CLAIMED` | This profile has already been claimed… |
| `BAD_PASSWORD` | That password doesn't match this invite. |
| `INVITE_LOCKED` | Too many wrong passwords… |
| `INVITE_EXPIRED` | This invite has expired… |
| `REVOKED` | This invite was revoked… |

## Memorial RPC codes

| Raw | User message |
|-----|----------------|
| `NOT_ALLOWED` | Private memorial or wrong password |
| `NODE_NOT_FOUND` | We couldn't find that memorial |
| `NOT_SIGNED_IN` | Please sign in first |

## Development logging

In dev builds, open the console and filter for `[tomora:userError]`. Each log includes:

- `userErrorId` — stable id for docs/tests
- `userMessage` — what the user saw
- `rawMessage` — original error string
- `devNotes` — hints (e.g. run migrations, configure SMTP)

## Adding a new error

1. Add a `UserErrorId` and `USER_ERROR_MESSAGES` entry in `src/lib/userErrors.ts`.
2. Add match patterns to `USER_ERROR_DEV_REFERENCE`.
3. Add a row to this doc.
4. Call `userMessageFromError(error, fallback, 'context')` in the service or UI catch block.
5. Add a unit test in `src/lib/__tests__/userErrors.test.ts`.
