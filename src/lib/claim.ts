const RAW_INVITE_CODE = /^[A-Za-z0-9]{4,32}$/;

/** Extract an invite code from a pasted claim link or raw code string. */
export function parseClaimCode(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const code = url.searchParams.get('code');
    if (code?.trim()) return code.trim().toUpperCase();
    return null;
  } catch {
    // Not a URL — treat as a raw invite code.
  }

  if (!RAW_INVITE_CODE.test(trimmed)) return null;
  return trimmed.toUpperCase();
}

export const CLAIM_SCAN_DEBOUNCE_MS = 2000;

/** Ignore duplicate QR scans of the same invite code within a short window. */
export function shouldAcceptClaimScan(
  code: string,
  last: { code: string; at: number } | undefined,
  now = Date.now(),
): boolean {
  return !(last && last.code === code && now - last.at < CLAIM_SCAN_DEBOUNCE_MS);
}
