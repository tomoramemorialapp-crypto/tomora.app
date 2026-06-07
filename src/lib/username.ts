import { isReservedUsername } from '@/lib/reservedUsernames';

/** Username rules — must match the server-side `set_username` RPC. */
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

export function normalizeUsername(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9_]/g, '');
}

export function validateUsername(username: string): string | null {
  if (!USERNAME_PATTERN.test(username)) {
    return `Username must be ${USERNAME_MIN}–${USERNAME_MAX} characters: lowercase letters, numbers, and underscores only.`;
  }
  if (isReservedUsername(username)) {
    return 'That username is reserved.';
  }
  return null;
}

export function isEmailIdentifier(value: string): boolean {
  return /\S+@\S+\.\S+/.test(value.trim());
}

export function isUsernameIdentifier(value: string): boolean {
  return USERNAME_PATTERN.test(normalizeUsername(value));
}
