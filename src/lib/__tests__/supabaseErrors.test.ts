import { describe, expect, it } from 'vitest';
import type { PostgrestError } from '@supabase/supabase-js';

import { userMessageFromSupabaseError } from '@/lib/supabaseErrors';

describe('supabaseErrors', () => {
  it('explains relationship_type check violations', () => {
    const msg = userMessageFromSupabaseError(
      {
        message: 'new row violates check constraint "relationships_relationship_type_check"',
        details: '',
        hint: '',
        code: '23514',
      } as PostgrestError,
      'fallback',
    );
    expect(msg).toContain('relationship_types_in_law');
    expect(msg).toContain('20260606170000');
  });
});
