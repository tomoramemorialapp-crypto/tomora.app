import { describe, expect, it } from 'vitest';

import { parseClaimCode } from '@/lib/claim';

describe('parseClaimCode', () => {
  it('parses code from claim URLs', () => {
    expect(parseClaimCode('https://tomora.app/claim?code=abc123')).toBe('ABC123');
    expect(parseClaimCode('http://localhost:8081/claim?code=xyz9')).toBe('XYZ9');
  });

  it('normalizes raw codes', () => {
    expect(parseClaimCode('  tom7  ')).toBe('TOM7');
  });

  it('returns null for empty input', () => {
    expect(parseClaimCode('')).toBeNull();
    expect(parseClaimCode('   ')).toBeNull();
  });

  it('ignores non-claim URLs (e.g. public profiles)', () => {
    expect(parseClaimCode('https://tomora.app/u/jane_doe')).toBeNull();
  });

  it('rejects codes that are too short or invalid', () => {
    expect(parseClaimCode('ab')).toBeNull();
    expect(parseClaimCode('not a code!')).toBeNull();
  });
});
