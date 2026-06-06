/**
 * Node claiming: generate an invite (code + optional password + shareable link)
 * for an unclaimed node, and claim a node from a code. Claiming runs through a
 * SECURITY DEFINER RPC so an invited member can attach to a node in a tree they
 * aren't a member of yet.
 */

import { claimUrl } from '@/constants/urls';
import { claimErrorMessage, type InvitePreviewReason } from '@/lib/claimErrors';
import { supabase } from '@/lib/supabase';
import type { FamilyNode } from '@/types/models';
import { mapNode } from './mappers';

const INVITE_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

/** Unambiguous code alphabet (no 0/O/1/I). */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(length = 8): string {
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

/** Build the shareable claim link for a code. */
export function claimLinkFor(code: string): string {
  return claimUrl(code);
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
  const { data: auth } = await supabase.auth.getUser();
  const patch: {
    invite_code: string;
    claim_password?: string | null;
    invite_expires_at: string;
    invited_by_account_id?: string | null;
    invite_failed_attempts: number;
    invite_locked_at: null;
  } = {
    invite_code: code,
    invite_expires_at: new Date(Date.now() + INVITE_TTL_MS).toISOString(),
    invite_failed_attempts: 0,
    invite_locked_at: null,
    invited_by_account_id: auth.user?.id ?? null,
  };
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
    .update({
      invite_code: null,
      claim_password: null,
      invite_expires_at: null,
      invite_failed_attempts: 0,
      invite_locked_at: null,
    })
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

export interface InvitePreview {
  valid: boolean;
  nodeId?: string;
  familyTreeId?: string;
  displayName?: string;
  inviterName?: string;
  treeName?: string;
  requiresPassword?: boolean;
  relationshipType?: string;
  reason?: InvitePreviewReason;
}

/** Pre-auth invite preview — display name and inviter only, no secrets. */
export async function previewInvite(code: string): Promise<InvitePreview> {
  const { data, error } = await supabase.rpc('peek_invite_code', {
    p_code: code.trim().toUpperCase(),
  });
  if (error) return { valid: false };
  const row = data as Record<string, unknown> | null;
  if (!row?.valid) {
    const reason = typeof row?.reason === 'string' ? (row.reason as InvitePreviewReason) : 'INVALID_CODE';
    return { valid: false, reason };
  }
  return {
    valid: true,
    nodeId: row.node_id ? String(row.node_id) : undefined,
    familyTreeId: row.family_tree_id ? String(row.family_tree_id) : undefined,
    displayName: String(row.display_name ?? ''),
    inviterName: String(row.inviter_name ?? 'Someone in your family'),
    treeName: String(row.tree_name ?? 'Family Tree'),
    requiresPassword: !!row.requires_password,
    relationshipType: row.relationship_type ? String(row.relationship_type) : undefined,
  };
}

/** Claim a node using its invite code (+ password if one was set). One-time use. */
export async function claimNode(code: string, password?: string): Promise<ClaimResult> {
  const { data, error } = await supabase.rpc('claim_node', {
    p_code: code.trim().toUpperCase(),
    p_password: password?.trim() ? password.trim() : undefined,
  });
  if (error) throw new Error(claimErrorMessage(error.message));
  const result = data as { node_id: string; family_tree_id: string; display_name: string };
  return { nodeId: result.node_id, familyTreeId: result.family_tree_id, displayName: result.display_name };
}

export interface NodeTransferRequest {
  transferId: string;
  expiresAt: string;
}

const TRANSFER_ERRORS: Record<string, string> = {
  NOT_SIGNED_IN: 'Sign in to transfer this node.',
  NOT_OWNER: 'Only the current node owner can start a transfer.',
  INVALID_EMAIL: 'Enter a valid email for the new owner.',
  NODE_NOT_FOUND: 'This profile is no longer in your Family Tree.',
};

/** Owner-initiated handoff — invite codes cannot be reused after claim. */
export async function requestNodeTransfer(nodeId: string, toEmail: string): Promise<NodeTransferRequest> {
  const { data, error } = await supabase.rpc('request_node_transfer', {
    p_node_id: nodeId,
    p_to_email: toEmail.trim(),
  });
  if (error) {
    const key = Object.keys(TRANSFER_ERRORS).find((k) => error.message.includes(k));
    throw new Error(key ? TRANSFER_ERRORS[key] : 'Could not start the transfer. Please try again.');
  }
  const row = data as { transfer_id: string; expires_at: string };
  return { transferId: row.transfer_id, expiresAt: row.expires_at };
}

export { MAX_FAILED_ATTEMPTS };
