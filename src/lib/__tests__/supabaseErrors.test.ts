import { describe, expect, it } from 'vitest';
import type { PostgrestError } from '@supabase/supabase-js';

import { userMessageFromSupabaseError } from '@/lib/supabaseErrors';
import { USER_ERROR_MESSAGES } from '@/lib/userErrors';

describe('supabaseErrors re-export', () => {
  it('hides schema migration details from users', () => {
    const msg = userMessageFromSupabaseError(
      {
        message: 'new row violates check constraint "nodes_status_check"',
        details: '',
        hint: '',
        code: '23514',
      } as PostgrestError,
      'fallback',
    );
    expect(msg).toBe(USER_ERROR_MESSAGES['database.schema_outdated']);
    expect(msg).not.toContain('npm run');
  });
});
