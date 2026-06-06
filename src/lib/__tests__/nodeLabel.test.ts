import { describe, expect, it } from 'vitest';
import { resolveTreeNodeFullName, resolveTreeNodeLabel } from '../nodeLabel';
import type { NodeProfile } from '@/types/profile';

const fieldMeta = {
  visibility: 'family_tree' as const,
  status: 'confirmed' as const,
  source: { sourceType: 'guardian' as const },
  lastEditedByAccountId: 'a1',
  lastEditedAt: '2026-01-01',
};

describe('resolveTreeNodeLabel', () => {
  it('prefers displayName over structured full name', () => {
    const profile: NodeProfile = {
      name: { value: { firstName: 'Rose', surname: 'Martinez' }, ...fieldMeta },
    };
    expect(resolveTreeNodeLabel({ displayName: 'Grandma Rose', profile })).toBe('Grandma Rose');
  });

  it('falls back to alternate name then structured name', () => {
    const profile: NodeProfile = {
      alternateNames: { value: ['Rosie'], ...fieldMeta },
      name: { value: { firstName: 'Rose', surname: 'Martinez' }, ...fieldMeta },
    };
    expect(resolveTreeNodeLabel({ displayName: '', profile })).toBe('Rosie');
  });

  it('exposes full name only when different from label', () => {
    const profile: NodeProfile = {
      name: { value: { firstName: 'Rose', surname: 'Martinez' }, ...fieldMeta },
    };
    expect(resolveTreeNodeFullName({ displayName: 'Grandma Rose', profile })).toBe('Rose Martinez');
  });
});
