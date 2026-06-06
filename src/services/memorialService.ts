import { supabase } from '@/lib/supabase';
import type { FamilyNode, MemorialPrivacy, MemorialRequest } from '@/types/models';
import type { TablesUpdate } from '@/types/database.types';
import { mapMemorialRequest, mapNode } from './mappers';

export interface RequestPassingResult {
  mode: 'finalized' | 'pending';
  requestId: string;
  resolveAfter?: string;
}

/** Report a node's passing. Pushes through if the caller has authority, else opens a dispute window. */
export async function requestPassing(input: {
  nodeId: string;
  deathDate?: string;
  reason?: string;
}): Promise<RequestPassingResult> {
  const { data, error } = await supabase.rpc('request_passing', {
    p_node_id: input.nodeId,
    p_death_date: input.deathDate ?? undefined,
    p_reason: input.reason ?? undefined,
  });
  if (error) throw new Error(friendly(error.message));
  const r = (data ?? {}) as { mode?: string; request_id?: string; resolve_after?: string };
  return {
    mode: r.mode === 'pending' ? 'pending' : 'finalized',
    requestId: String(r.request_id ?? ''),
    resolveAfter: r.resolve_after ?? undefined,
  };
}

/** Confirm a pending passing immediately (family consensus / after the window). */
export async function finalizeMemorial(requestId: string): Promise<void> {
  const { error } = await supabase.rpc('finalize_memorial', { p_request_id: requestId });
  if (error) throw new Error(friendly(error.message));
}

/** Dispute a pending passing report. */
export async function disputeMemorial(requestId: string, reason?: string): Promise<void> {
  const { error } = await supabase.rpc('dispute_memorial', {
    p_request_id: requestId,
    p_reason: reason ?? undefined,
  });
  if (error) throw new Error(friendly(error.message));
}

/** The most recent memorial request for a node (pending/disputed take precedence). */
export async function fetchMemorialRequestForNode(nodeId: string): Promise<MemorialRequest | null> {
  const { data, error } = await supabase
    .from('memorial_requests')
    .select('*')
    .eq('node_id', nodeId)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  const row = (data ?? [])[0];
  return row ? mapMemorialRequest(row) : null;
}

export interface MemorialPagePatch {
  memorialBannerUrl?: string | null;
  memorialBio?: string | null;
  memorialTitle?: string | null;
  memorialLinkLabel?: string | null;
  memorialLinkUrl?: string | null;
  memorialPrivacy?: MemorialPrivacy;
  memorialPassword?: string | null;
  alternateNames?: string[];
}

/** Edit the shareable memorial/tribute page fields for a node. */
export async function updateMemorialPage(nodeId: string, patch: MemorialPagePatch): Promise<FamilyNode> {
  const update: TablesUpdate<'nodes'> = { updated_at: new Date().toISOString() };
  if (patch.memorialBannerUrl !== undefined) update.memorial_banner_url = patch.memorialBannerUrl;
  if (patch.memorialBio !== undefined) update.memorial_bio = patch.memorialBio;
  if (patch.memorialTitle !== undefined) update.memorial_title = patch.memorialTitle;
  if (patch.memorialLinkLabel !== undefined) update.memorial_link_label = patch.memorialLinkLabel;
  if (patch.memorialLinkUrl !== undefined) update.memorial_link_url = patch.memorialLinkUrl;
  if (patch.memorialPrivacy !== undefined) update.memorial_privacy = patch.memorialPrivacy;
  if (patch.memorialPassword !== undefined) update.memorial_password = patch.memorialPassword;
  if (patch.alternateNames !== undefined) update.alternate_names = patch.alternateNames;

  const { data, error } = await supabase.from('nodes').update(update).eq('id', nodeId).select().single();
  if (error) throw error;
  return mapNode(data);
}

/** Read a shareable memorial page (works for public / password-protected pages too). */
export async function getMemorialPage(
  nodeId: string,
  password?: string,
): Promise<{ node: Record<string, unknown>; memories: Record<string, unknown>[] }> {
  const { data, error } = await supabase.rpc('get_memorial_page', {
    p_node_id: nodeId,
    p_password: password ?? undefined,
  });
  if (error) throw new Error(friendly(error.message));
  const r = (data ?? {}) as { node?: Record<string, unknown>; memories?: Record<string, unknown>[] };
  return { node: r.node ?? {}, memories: r.memories ?? [] };
}

function friendly(message: string): string {
  if (message.includes('NOT_SIGNED_IN')) return 'Please sign in first.';
  if (message.includes('NOT_A_MEMBER')) return 'You are not part of this family tree.';
  if (message.includes('NODE_NOT_FOUND')) return 'We couldn’t find that profile.';
  if (message.includes('NOT_A_MEMORIAL')) return 'This profile is not a memorial yet.';
  if (message.includes('NOT_ALLOWED')) return 'This memorial is private or the password is incorrect.';
  if (message.includes('REQUEST_NOT_FOUND')) return 'That request no longer exists.';
  return message;
}
