import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types/models';
import { mapNotification } from './mappers';

/** All notifications addressed to this account, newest first. */
export async function fetchNotifications(accountId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_account_id', accountId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map(mapNotification);
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(accountId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_account_id', accountId)
    .eq('is_read', false);
  if (error) throw error;
}
