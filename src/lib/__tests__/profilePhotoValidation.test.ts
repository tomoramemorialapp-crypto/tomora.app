import { describe, expect, it } from 'vitest';
import {
  PROFILE_PHOTO_ERROR_COPY,
  profilePhotoValidationMessage,
  resolveProfilePhotoMime,
  validateProfilePhoto,
} from '../profilePhotoValidation';
import type { PickedFile } from '../media';

const photo = (overrides: Partial<PickedFile>): PickedFile => ({
  uri: 'file:///test.jpg',
  name: 'test.jpg',
  size: 1024,
  kind: 'photo',
  ...overrides,
});

describe('validateProfilePhoto', () => {
  it('accepts jpeg by mime', () => {
    expect(validateProfilePhoto(photo({ mimeType: 'image/jpeg' })).valid).toBe(true);
  });

  it('accepts png by extension when mime is missing', () => {
    const result = validateProfilePhoto(photo({ name: 'portrait.png', mimeType: undefined }));
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.mimeType).toBe('image/png');
  });

  it('rejects pdf', () => {
    const result = validateProfilePhoto(photo({ mimeType: 'application/pdf', name: 'doc.pdf' }));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('unsupported_type');
      expect(profilePhotoValidationMessage(result)).toBe(PROFILE_PHOTO_ERROR_COPY);
    }
  });

  it('rejects files over 10MB', () => {
    const result = validateProfilePhoto(photo({ size: 11 * 1024 * 1024, mimeType: 'image/jpeg' }));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('file_too_large');
      expect(profilePhotoValidationMessage(result, 11 * 1024 * 1024)).toContain('11 MB');
    }
  });

  it('normalizes image/jpg', () => {
    expect(resolveProfilePhotoMime({ name: 'a.jpg', mimeType: 'image/jpg' })).toBe('image/jpeg');
  });
});
