import { describe, expect, it } from 'vitest';

import { extractStoragePath, isAccountOwnedStoragePath } from '@/lib/storagePaths';

describe('storageCleanup', () => {
  it('keeps raw storage paths', () => {
    expect(extractStoragePath('abc-123/photo.jpg')).toBe('abc-123/photo.jpg');
  });

  it('parses Supabase signed URLs', () => {
    expect(
      extractStoragePath(
        'https://xyz.supabase.co/storage/v1/object/sign/media/abc-123/banner.jpg?token=foo',
      ),
    ).toBe('abc-123/banner.jpg');
  });

  it('ignores external URLs', () => {
    expect(extractStoragePath('https://example.com/photo.jpg')).toBeNull();
  });

  it('checks account ownership prefix', () => {
    expect(isAccountOwnedStoragePath('user-id/file.jpg', 'user-id')).toBe(true);
    expect(isAccountOwnedStoragePath('other-id/file.jpg', 'user-id')).toBe(false);
  });
});
