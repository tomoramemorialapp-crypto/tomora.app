/** Extract an invite code from a pasted claim link or raw code string. */
export function parseClaimCode(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const code = url.searchParams.get('code');
    if (code?.trim()) return code.trim().toUpperCase();
  } catch {
    // Not a URL — treat as a raw code.
  }

  return trimmed.toUpperCase();
}
