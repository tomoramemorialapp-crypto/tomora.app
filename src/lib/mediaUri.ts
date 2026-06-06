import { useEffect, useState } from 'react';

import { getSignedUrl } from '@/lib/media';

/** True when the value is a Supabase storage path, not a public/http URL. */
export function isStoragePath(uri?: string): boolean {
  if (!uri) return false;
  return !uri.startsWith('http://') && !uri.startsWith('https://') && !uri.startsWith('data:');
}

/** Resolve a storage path to a signed URL for display (cached in media.ts). */
export async function resolveMediaUri(uri?: string): Promise<string | undefined> {
  if (!uri) return undefined;
  if (!isStoragePath(uri)) return uri;
  return (await getSignedUrl(uri)) ?? undefined;
}

/** Hook that resolves storage paths to signed URLs for images. */
export function useMediaUri(uri?: string): string | undefined {
  const [resolved, setResolved] = useState<string | undefined>(() =>
    uri && !isStoragePath(uri) ? uri : undefined,
  );

  useEffect(() => {
    let alive = true;
    if (!uri) {
      setResolved(undefined);
      return;
    }
    if (!isStoragePath(uri)) {
      setResolved(uri);
      return;
    }
    resolveMediaUri(uri).then((url) => {
      if (alive) setResolved(url);
    });
    return () => {
      alive = false;
    };
  }, [uri]);

  return resolved;
}
