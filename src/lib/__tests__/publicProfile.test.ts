import { describe, expect, it } from 'vitest';

import {
  friendlyPublicMemoryUnlockError,
  mapPublicMemoryMedia,
  normalizePublicUsernameParam,
} from '@/lib/publicProfile';

describe('normalizePublicUsernameParam', () => {
  it('lowercases and strips invalid characters', () => {
    expect(normalizePublicUsernameParam('Jane_Doe')).toBe('jane_doe');
    expect(normalizePublicUsernameParam('  USER  ')).toBe('user');
  });
});

describe('mapPublicMemoryMedia', () => {
  it('maps camelCase and snake_case items', () => {
    const items = mapPublicMemoryMedia([
      { storagePath: 'acct/photo.jpg', kind: 'photo', sizeBytes: 1200, name: 'pic' },
      { storage_path: 'acct/vid.mp4', kind: 'video', size_bytes: 9000 },
    ]);
    expect(items).toHaveLength(2);
    expect(items[0]?.storagePath).toBe('acct/photo.jpg');
    expect(items[1]?.kind).toBe('video');
  });

  it('ignores invalid rows', () => {
    expect(mapPublicMemoryMedia([{ kind: 'photo' }, null, 'bad'])).toHaveLength(0);
  });
});

describe('friendlyPublicMemoryUnlockError', () => {
  it('maps known server messages', () => {
    expect(friendlyPublicMemoryUnlockError('Incorrect password.')).toContain("didn't work");
    expect(friendlyPublicMemoryUnlockError('PASSWORD_REQUIRED')).toContain('Enter the password');
  });
});
