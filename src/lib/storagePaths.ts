/** Parse a Supabase storage object path from a path string or signed/object URL. */
export function extractStoragePath(reference?: string | null): string | null {
  if (!reference?.trim()) return null;
  const value = reference.trim();
  if (
    !value.startsWith('http://') &&
    !value.startsWith('https://') &&
    !value.startsWith('data:')
  ) {
    return value;
  }

  const match = value.match(/\/storage\/v1\/object\/(?:sign|public|authenticated)\/media\/([^?]+)/i);
  if (match?.[1]) return decodeURIComponent(match[1]);

  return null;
}

export function isAccountOwnedStoragePath(path: string, accountId: string): boolean {
  return path.startsWith(`${accountId}/`);
}
