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
});
