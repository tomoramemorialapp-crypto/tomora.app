/** Minimum password length — aligned across sign-up, login, reset, and account settings. */
export const PASSWORD_MIN_LENGTH = 8;

export function passwordMeetsMinLength(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH;
}

export function passwordMinLengthHint(): string {
  return `At least ${PASSWORD_MIN_LENGTH} characters`;
}

export function validatePasswordLength(password: string): string | null {
  if (!passwordMeetsMinLength(password)) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  return null;
}
