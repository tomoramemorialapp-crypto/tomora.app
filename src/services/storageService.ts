import { supabase } from '@/lib/supabase';

import { getAccountMediaUsage } from './memoryService';

/** Total bytes stored in the private media bucket for this account. */
export async function getAccountStorageUsage(accountId: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_account_storage_bytes', { p_account_id: accountId });
  if (!error && data != null) return Number(data);

  // Fallback when the RPC is not deployed yet — memory media only.
  return getAccountMediaUsage(accountId);
}
