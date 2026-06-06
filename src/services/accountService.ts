import { supabase } from '@/lib/supabase';
import type { Account, FamilyNode, PublicProfileConfig, SocialLinks, ThemePreference } from '@/types/models';
import type { Json, Tables, TablesUpdate } from '@/types/database.types';
import { mapAccount, mapNode } from './mappers';

const GRACE_DAYS = 30;

export interface AccountSettingsPatch {
  displayName?: string;
  socialLinks?: SocialLinks;
  language?: string;
  themePreference?: ThemePreference;
}

/** Update editable account-level settings. Username is handled via setUsername. */
export async function updateAccountSettings(
  accountId: string,
  patch: AccountSettingsPatch,
): Promise<Account> {
  const row: TablesUpdate<'accounts'> = { updated_at: new Date().toISOString() };
  if (patch.displayName !== undefined) row.display_name = patch.displayName.trim() || 'You';
  if (patch.socialLinks !== undefined) row.social_links = patch.socialLinks as Json;
  if (patch.language !== undefined) row.language = patch.language;
  if (patch.themePreference !== undefined) row.theme_preference = patch.themePreference;

  const { data, error } = await supabase
    .from('accounts')
    .update(row)
    .eq('id', accountId)
    .select()
    .single();
  if (error) throw error;
  return mapAccount(data);
}

/**
 * Set or change the username. Enforced server-side: 3–30 chars [a-z0-9_],
 * one user per username (case-insensitive), max 2 changes per rolling 30 days.
 * Throws with a human-readable message on violation.
 */
export async function setUsername(username: string): Promise<Account> {
  const { data, error } = await supabase.rpc('set_username', { p_username: username });
  if (error) throw new Error(error.message);
  return mapAccount(data as Tables<'accounts'>);
}

/** How many username changes remain in the trailing 30-day window. */
export function usernameChangesRemaining(account: Account | null): number {
  if (!account) return 2;
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = account.usernameChanges.filter((ts) => new Date(ts).getTime() > cutoff).length;
  return Math.max(0, 2 - recent);
}

/** Update the owner-controlled public profile config (merged into preferences). */
export async function updatePublicProfile(
  accountId: string,
  patch: Partial<PublicProfileConfig>,
): Promise<Account> {
  const { data: current, error: readErr } = await supabase
    .from('accounts')
    .select('preferences')
    .eq('id', accountId)
    .single();
  if (readErr) throw readErr;
  const prefs = ((current?.preferences ?? {}) as Record<string, unknown>) || {};
  const existing = (prefs.publicProfile ?? {}) as Partial<PublicProfileConfig>;
  const merged = { ...existing, ...patch };
  const nextPrefs = { ...prefs, publicProfile: merged } as Json;

  const { data, error } = await supabase
    .from('accounts')
    .update({ preferences: nextPrefs, updated_at: new Date().toISOString() })
    .eq('id', accountId)
    .select()
    .single();
  if (error) throw error;
  return mapAccount(data);
}

/** Change the signed-in user's email (Supabase may require confirmation). */
export async function updateEmail(newEmail: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
  if (error) throw error;
}

/** Change the signed-in user's password. */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export interface DeletionResult {
  account: Account;
  nodes: FamilyNode[];
}

/**
 * Begin account deletion: a 30-day grace period during which everything is
 * preserved and reversible. The user's owned nodes are flagged `vacated` (and
 * tagged "Vacated") so the family can see the light is paused, while names and
 * relationships remain intact.
 */
export async function requestAccountDeletion(accountId: string): Promise<DeletionResult> {
  const now = new Date();
  const scheduled = new Date(now.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);

  const { data: acctRow, error: acctErr } = await supabase
    .from('accounts')
    .update({
      status: 'vacated',
      deletion_requested_at: now.toISOString(),
      deletion_scheduled_for: scheduled.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', accountId)
    .select()
    .single();
  if (acctErr) throw acctErr;

  const nodes = await tagOwnedNodes(accountId, true);
  return { account: mapAccount(acctRow), nodes };
}

/** Cancel a pending deletion within the grace period: restore everything. */
export async function undoAccountDeletion(accountId: string): Promise<DeletionResult> {
  const { data: acctRow, error: acctErr } = await supabase
    .from('accounts')
    .update({
      status: 'active',
      deletion_requested_at: null,
      deletion_scheduled_for: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', accountId)
    .select()
    .single();
  if (acctErr) throw acctErr;

  const nodes = await tagOwnedNodes(accountId, false);
  return { account: mapAccount(acctRow), nodes };
}

/** Flag or unflag the account's owned nodes as Vacated. Returns updated nodes. */
async function tagOwnedNodes(accountId: string, vacate: boolean): Promise<FamilyNode[]> {
  const { data: owned, error } = await supabase
    .from('nodes')
    .select()
    .eq('owner_account_id', accountId);
  if (error) throw error;

  const updated: FamilyNode[] = [];
  for (const row of owned ?? []) {
    const tags = new Set(row.tags ?? []);
    if (vacate) tags.add('Vacated');
    else tags.delete('Vacated');
    const { data: upd, error: updErr } = await supabase
      .from('nodes')
      .update({
        status: vacate ? 'vacated' : 'claimed',
        tags: [...tags],
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id)
      .select()
      .single();
    if (updErr) throw updErr;
    updated.push(mapNode(upd));
  }
  return updated;
}
