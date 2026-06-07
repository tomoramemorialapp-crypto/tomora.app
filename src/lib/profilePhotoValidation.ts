import type { PickedFile } from './media';

function formatPhotoSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb < 10 ? `${mb.toFixed(1)} MB` : `${Math.round(mb)} MB`;
}

import { USER_ERROR_MESSAGES } from '@/lib/userErrors';

export const PROFILE_PHOTO_MAX_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_PROFILE_PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

const EXTENSION_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

export type ProfilePhotoInvalidReason = 'unsupported_type' | 'file_too_large';

export type ProfilePhotoValidationResult =
  | { valid: true; mimeType: string }
  | { valid: false; reason: ProfilePhotoInvalidReason };

export const PROFILE_PHOTO_ERROR_COPY = USER_ERROR_MESSAGES['media.profile_photo_invalid'];

/** Resolve a MIME type from picker metadata or file extension. */
export function resolveProfilePhotoMime(file: Pick<PickedFile, 'name' | 'mimeType'>): string | undefined {
  const raw = file.mimeType?.toLowerCase().trim();
  if (raw === 'image/jpg') return 'image/jpeg';
  if (raw) return raw;

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext && EXTENSION_MIME[ext]) return EXTENSION_MIME[ext];
  return undefined;
}

export function validateProfilePhoto(file: PickedFile): ProfilePhotoValidationResult {
  const mimeType = resolveProfilePhotoMime(file);
  if (!mimeType || !ACCEPTED_PROFILE_PHOTO_TYPES.includes(mimeType as (typeof ACCEPTED_PROFILE_PHOTO_TYPES)[number])) {
    return { valid: false, reason: 'unsupported_type' };
  }

  const size = file.size > 0 ? file.size : 0;
  if (size > PROFILE_PHOTO_MAX_BYTES) {
    return { valid: false, reason: 'file_too_large' };
  }

  return { valid: true, mimeType };
}

export function profilePhotoValidationMessage(
  result: Extract<ProfilePhotoValidationResult, { valid: false }>,
  fileSize = 0,
): string {
  if (result.reason === 'file_too_large' && fileSize > 0) {
    return `${PROFILE_PHOTO_ERROR_COPY} (This file is ${formatPhotoSize(fileSize)}.)`;
  }
  return PROFILE_PHOTO_ERROR_COPY;
}
