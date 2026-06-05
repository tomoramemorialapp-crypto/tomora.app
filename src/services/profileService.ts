import { supabase } from '@/lib/supabase';
import type { FamilyNode } from '@/types/models';
import type {
  ChangeLogAction,
  NodeProfile,
  ProfileChangeLog,
  ProfileFieldKey,
  SuggestedEdit,
} from '@/types/profile';
import type { Json, TablesUpdate } from '@/types/database.types';
import { profileToFlatColumns } from '@/lib/profile';
import { mapChangeLog, mapNode, mapSuggestedEdit } from './mappers';

export interface ChangeLogEntryInput {
  fieldKey?: ProfileFieldKey | string;
  action: ChangeLogAction;
  previousValue?: unknown;
  newValue?: unknown;
  note?: string;
}

/**
 * Save a node's edited profile. Persists the full `NodeProfile` jsonb, syncs the
 * legacy flat columns, optionally updates tags + visibility, and writes one
 * Change History row per logical change.
 */
export async function updateNodeProfile(input: {
  treeId: string;
  nodeId: string;
  accountId: string;
  profile: NodeProfile;
  tags?: string[];
  defaultVisibility?: FamilyNode['defaultVisibility'];
  changeLog: ChangeLogEntryInput[];
}): Promise<FamilyNode> {
  const { treeId, nodeId, accountId, profile, tags, defaultVisibility, changeLog } = input;

  const patch: TablesUpdate<'nodes'> = {
    profile: profile as unknown as Json,
    updated_at: new Date().toISOString(),
    ...profileToFlatColumns(profile),
  };
  if (tags) patch.tags = tags;
  if (defaultVisibility) patch.default_visibility = defaultVisibility;

  const { data, error } = await supabase
    .from('nodes')
    .update(patch)
    .eq('id', nodeId)
    .select()
    .single();
  if (error) throw error;

  if (changeLog.length) {
    const rows = changeLog.map((c) => ({
      node_id: nodeId,
      family_tree_id: treeId,
      field_key: (c.fieldKey as string) ?? null,
      action: c.action,
      previous_value: (c.previousValue ?? null) as Json,
      new_value: (c.newValue ?? null) as Json,
      performed_by_account_id: accountId,
      note: c.note ?? null,
    }));
    const { error: logErr } = await supabase.from('node_change_log').insert(rows);
    if (logErr) throw logErr;
  }

  return mapNode(data);
}

export async function fetchChangeLog(nodeId: string): Promise<ProfileChangeLog[]> {
  const { data, error } = await supabase
    .from('node_change_log')
    .select()
    .eq('node_id', nodeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapChangeLog);
}

/** Submit a suggested change to a field the viewer cannot edit directly. */
export async function createSuggestedEdit(input: {
  treeId: string;
  nodeId: string;
  accountId: string;
  fieldKey: ProfileFieldKey;
  currentValueSnapshot: unknown;
  suggestedValue: unknown;
  reason?: string;
}): Promise<SuggestedEdit> {
  const { treeId, nodeId, accountId, fieldKey, currentValueSnapshot, suggestedValue, reason } = input;
  const { data, error } = await supabase
    .from('suggested_edits')
    .insert({
      family_tree_id: treeId,
      target_node_id: nodeId,
      field_key: fieldKey,
      current_value_snapshot: (currentValueSnapshot ?? null) as Json,
      suggested_value: (suggestedValue ?? null) as Json,
      suggested_by_account_id: accountId,
      reason: reason ?? null,
      status: 'pending',
    })
    .select()
    .single();
  if (error) throw error;

  await supabase.from('node_change_log').insert({
    node_id: nodeId,
    family_tree_id: treeId,
    field_key: fieldKey,
    action: 'suggested_edit_submitted',
    new_value: (suggestedValue ?? null) as Json,
    performed_by_account_id: accountId,
    note: reason ?? null,
  });

  return mapSuggestedEdit(data);
}

export async function fetchSuggestedEditsForTree(treeId: string): Promise<SuggestedEdit[]> {
  const { data, error } = await supabase
    .from('suggested_edits')
    .select()
    .eq('family_tree_id', treeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapSuggestedEdit);
}

export async function reviewSuggestedEdit(input: {
  editId: string;
  reviewerAccountId: string;
  status: 'approved' | 'rejected' | 'needs_more_info';
  reviewNote?: string;
}): Promise<SuggestedEdit> {
  const { editId, reviewerAccountId, status, reviewNote } = input;
  const { data, error } = await supabase
    .from('suggested_edits')
    .update({
      status,
      reviewed_by_account_id: reviewerAccountId,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', editId)
    .select()
    .single();
  if (error) throw error;
  return mapSuggestedEdit(data);
}
