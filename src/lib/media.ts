/**
 * Media helpers: device pickers, Supabase Storage uploads, per-memory size
 * caps, signed URLs, and human-friendly byte formatting.
 *
 * Uploaded media lives in the private `media` bucket and is account-side only
 * (owner-scoped RLS). Nothing here makes media public; sharing is governed by a
 * memory's own visibility within the app.
 */

import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

import { supabase } from '@/lib/supabase';
import type { MemoryType } from '@/types/models';

const MB = 1024 * 1024;

/** Media kinds a memory file upload can be. */
export type UploadMediaKind = 'photo' | 'video' | 'audio' | 'document';

/** Per-file upload caps (bytes). Photos/audio/files: 10MB. Videos: 100MB. */
export const MEDIA_CAPS: Record<UploadMediaKind, number> = {
  photo: 10 * MB,
  audio: 10 * MB,
  document: 10 * MB,
  video: 100 * MB,
};

/** Combined media allowance for a single memory (across all files): 100MB. */
export const MAX_MEDIA_BYTES_PER_MEMORY = 100 * MB;
/** Text allowance (title + caption + story) for a single memory: 10MB. */
export const MAX_TEXT_BYTES_PER_MEMORY = 10 * MB;
/** Total per-memory ceiling: 110MB. */
export const MAX_MEMORY_BYTES = MAX_MEDIA_BYTES_PER_MEMORY + MAX_TEXT_BYTES_PER_MEMORY;

/** Soft per-account storage quota used by the profile usage tracker. */
export const STORAGE_QUOTA_BYTES = 1024 * MB; // 1 GB

export const STORAGE_BUCKET = 'media';

export interface PickedFile {
  uri: string;
  name: string;
  size: number;
  mimeType?: string;
  kind: UploadMediaKind;
}

export interface UploadedMedia {
  storagePath: string;
  sizeBytes: number;
  mime?: string;
}

/** Map an upload kind to the memory `type` stored on the row. */
export function memoryTypeForKind(kind: UploadMediaKind): MemoryType {
  return kind === 'document' ? 'document' : kind;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return '0 MB';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export function capFor(kind: UploadMediaKind): number {
  return MEDIA_CAPS[kind];
}

/** True when the picked file is within the per-file cap for its kind. */
export function isWithinCap(file: PickedFile): boolean {
  return file.size <= capFor(file.kind);
}

/** Sum the byte size of a set of files. */
export function sumBytes(files: { size: number }[]): number {
  return files.reduce((s, f) => s + (f.size || 0), 0);
}

export function inferKindFromMime(mime?: string): UploadMediaKind {
  if (!mime) return 'document';
  if (mime.startsWith('image/')) return 'photo';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'document';
}

/** Launch the appropriate device picker for the requested kind. */
export async function pickMedia(kind: UploadMediaKind): Promise<PickedFile | null> {
  if (kind === 'photo' || kind === 'video') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted' && Platform.OS !== 'web') return null;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: kind === 'photo' ? ['images'] : ['videos'],
      quality: 0.9,
      allowsEditing: kind === 'photo' && Platform.OS !== 'web',
      aspect: kind === 'photo' ? [1, 1] : undefined,
    });
    if (result.canceled || !result.assets?.length) return null;
    const a = result.assets[0];
    return {
      uri: a.uri,
      name: a.fileName ?? `${kind}-${Date.now()}`,
      size: a.fileSize ?? 0,
      mimeType: a.mimeType,
      kind,
    };
  }

  const result = await DocumentPicker.getDocumentAsync({
    type: kind === 'audio' ? 'audio/*' : '*/*',
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.length) return null;
  const a = result.assets[0];
  return {
    uri: a.uri,
    name: a.name ?? `file-${Date.now()}`,
    size: a.size ?? 0,
    mimeType: a.mimeType,
    kind: kind === 'audio' ? 'audio' : inferKindFromMime(a.mimeType),
  };
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
}

/** Read a picked file into a Blob/ArrayBuffer suitable for Storage upload. */
async function readFileBody(file: PickedFile): Promise<{ body: Blob | ArrayBuffer; size: number }> {
  if (Platform.OS === 'web') {
    const res = await fetch(file.uri);
    const blob = await res.blob();
    return { body: blob, size: blob.size };
  }
  // Native: read base64 then decode to bytes.
  const base64 = await FileSystem.readAsStringAsync(file.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { body: bytes.buffer, size: bytes.byteLength };
}

/** Upload a picked file to the private media bucket under the account's prefix. */
export async function uploadMedia(accountId: string, file: PickedFile): Promise<UploadedMedia> {
  const { body, size } = await readFileBody(file);
  const path = `${accountId}/${Date.now()}-${sanitizeName(file.name)}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, body, {
    contentType: file.mimeType,
    upsert: false,
  });
  if (error) throw error;
  return { storagePath: path, sizeBytes: file.size || size, mime: file.mimeType };
}

/** Remove a stored object (best-effort). */
export async function removeMedia(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
  if (error) console.warn('[tomora] media remove failed', error.message);
}

const signedUrlCache = new Map<string, { url: string; expires: number }>();

/** Create (and cache) a temporary signed URL for a private storage object. */
export async function getSignedUrl(storagePath: string, expiresInSec = 3600): Promise<string | null> {
  const cached = signedUrlCache.get(storagePath);
  if (cached && cached.expires > Date.now() + 30_000) return cached.url;
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresInSec);
  if (error || !data) {
    console.warn('[tomora] signed url failed', error?.message);
    return null;
  }
  signedUrlCache.set(storagePath, { url: data.signedUrl, expires: Date.now() + expiresInSec * 1000 });
  return data.signedUrl;
}
