/**
 * Node claiming: generate an invite (code + optional password + shareable link)
 * for an unclaimed node, and claim a node from a code. Claiming runs through a
 * SECURITY DEFINER RPC so an invited member can attach to a node in a tree they
 * aren't a member of yet.
 */

import { supabase } from '@/lib/supabase';
import type { FamilyNode } from '@/types/models';
import { mapNode } from './mappers';

/** Base URL used for shareable claim links (web demo). */
const CLAIM_BASE_URL = 'https://tomora.app/claim';

/** Unambiguous code alphabet (no 0/O/1/I). */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(length = 8): string {
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

/** Build the shareable claim link for a code. */
export function claimLinkFor(code: string): string {
  return `${CLAIM_BASE_URL}?code=${encodeURIComponent(code)}`;
}

export interface NodeInvite {
  node: FamilyNode;
  code: string;
  password?: string;
  link: string;
}

/**
 * Ensure the node has an invite code (creating one if needed) and optionally set
 * or clear a claim password. Returns the resulting invite details.
 */
export async function ensureNodeInvite(
  node: FamilyNode,
  opts: { password?: string | null; regenerate?: boolean } = {},
): Promise<NodeInvite> {
  const code = !opts.regenerate && node.inviteCode ? node.inviteCode : generateCode();
  const patch: { invite_code: string; claim_password?: string | null } = { invite_code: code };
  if (opts.password !== undefined) patch.claim_password = opts.password ? opts.password.trim() : null;

  const { data, error } = await supabase
    .from('nodes')
    .update(patch)
    .eq('id', node.id)
    .select()
    .single();
  if (error) throw error;
  const updated = mapNode(data);
  return { node: updated, code, password: updated.claimPassword, link: claimLinkFor(code) };
}

/** Remove a node's invite (revoke the code + password). */
export async function clearNodeInvite(nodeId: string): Promise<FamilyNode> {
  const { data, error } = await supabase
    .from('nodes')
    .update({ invite_code: null, claim_password: null })
    .eq('id', nodeId)
    .select()
    .single();
  if (error) throw error;
  return mapNode(data);
}

export interface ClaimResult {
  nodeId: string;
  familyTreeId: string;
  displayName: string;
}

/** Friendly messages for the RPC's raised exceptions. */
const CLAIM_ERRORS: Record<string, string> = {
  NOT_SIGNED_IN: 'Please sign in or create your account first, then claim.',
  INVALID_CODE: 'We couldn’t find that invite code. Double-check it with the person who invited you.',
  ALREADY_CLAIMED: 'This profile has already been claimed.',
  BAD_PASSWORD: 'That password doesn’t match this invite.',
};

/** Claim a node using its invite code (+ password if one was set). */
export async function claimNode(code: string, password?: string): Promise<ClaimResult> {
  const { data, error } = await supabase.rpc('claim_node', {
    p_code: code.trim().toUpperCase(),
    p_password: password?.trim() ? password.trim() : null,
  });
  if (error) {
    const key = Object.keys(CLAIM_ERRORS).find((k) => error.message.includes(k));
    throw new Error(key ? CLAIM_ERRORS[key] : 'We couldn’t complete the claim. Please try again.');
  }
  const result = data as { node_id: string; family_tree_id: string; display_name: string };
  return { nodeId: result.node_id, familyTreeId: result.family_tree_id, displayName: result.display_name };
}
