import type { Href } from 'expo-router';

import { normalizeUsername } from '@/lib/username';
import type { MemoryMediaItem } from '@/types/models';

/** Route to the signed-in public profile editor (inside tabs). */
export const PUBLIC_PROFILE_EDITOR_PATH = '/settings/public-profile' as Href;

/** Normalize a /u/{username} param before RPC lookup. */
export function normalizePublicUsernameParam(raw: string): string {
  return normalizeUsername(String(raw ?? '').trim());
}

/** Map memory media JSON from public profile RPCs. */
export function mapPublicMemoryMedia(raw: unknown): MemoryMediaItem[] {
  if (!Array.isArray(raw)) return [];
  const out: MemoryMediaItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const storagePath = String(r.storagePath ?? r.storage_path ?? '').trim();
    if (!storagePath) continue;
    const kind = r.kind as MemoryMediaItem['kind'] | undefined;
    out.push({
      storagePath,
      sizeBytes: Number(r.sizeBytes ?? r.size_bytes ?? 0),
      mime: (r.mime as string | undefined) ?? (r.media_mime as string | undefined),
      kind: kind === 'video' || kind === 'audio' || kind === 'document' ? kind : 'photo',
      name: (r.name as string | undefined) ?? undefined,
    });
  }
  return out;
}

export { friendlyPublicMemoryUnlockError } from '@/lib/userErrors';
