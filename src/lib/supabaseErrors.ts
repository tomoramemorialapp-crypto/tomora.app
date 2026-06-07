import type { PostgrestError } from '@supabase/supabase-js';

/** Turn PostgREST/Postgres errors into user-facing messages. */
export function userMessageFromSupabaseError(
  error: PostgrestError | null | undefined,
  fallback: string,
): string {
  if (!error) return fallback;

  const msg = error.message ?? '';
  const details = error.details ?? '';
  const combined = `${msg} ${details}`.toLowerCase();

  if (combined.includes('relationship_type') && combined.includes('check')) {
    return (
      'This relationship type is not enabled in the database yet. ' +
      'Apply the latest Supabase migration (20260606170000_relationship_types_in_law) and try again.'
    );
  }

  if (combined.includes('invalid input value for enum') && combined.includes('relationship')) {
    return (
      'This relationship type is not enabled in the database yet. ' +
      'Apply the latest Supabase migration (20260606170000_relationship_types_in_law) and try again.'
    );
  }

  if (error.code === '42501') {
    return 'You do not have permission to change this connection.';
  }

  return msg || fallback;
}
