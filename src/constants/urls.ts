/** Public app base URL — used for invite, claim, and profile links. */
export const APP_BASE_URL = (process.env.EXPO_PUBLIC_APP_URL ?? 'https://tomora.app').replace(/\/$/, '');

export function claimUrl(code: string): string {
  return `${APP_BASE_URL}/claim?code=${encodeURIComponent(code)}`;
}

export function inviteUrl(inviteCode: string): string {
  return `${APP_BASE_URL}/invite/${encodeURIComponent(inviteCode)}`;
}

export function publicProfileUrl(username: string): string {
  return `${APP_BASE_URL}/u/${encodeURIComponent(username)}`;
}
