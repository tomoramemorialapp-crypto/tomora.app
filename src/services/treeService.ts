import { supabase } from '@/lib/supabase';
import type {
  Account,
  FamilyTree,
  FamilyNode,
  Memory,
  Relationship,
  RelationshipType,
  VisibilityLevel,
} from '@/types/models';
import { isLivingFor, nodeStatusFor } from '@/lib/relationshipUtils';
import { makeField, parsePersonNameFromString } from '@/lib/profile';
import type { EditScope } from '@/lib/profile';
import type { NodeProfile, SuggestedEdit } from '@/types/profile';
import type { Json, Tables } from '@/types/database.types';
import {
  mapAccount,
  mapMemory,
  mapNode,
  mapRelationship,
  mapSuggestedEdit,
  mapTree,
} from './mappers';

/** Seed a minimal profile so the very first name carries provenance metadata. */
function seedProfile(fullName: string, scope: EditScope, accountId: string): NodeProfile {
  return {
    name: makeField(parsePersonNameFromString(fullName), {
      visibility: 'family_tree',
      scope,
      accountId,
      confirmed: scope !== 'suggest',
    }),
  };
}

/** Ensure the signed-in user's account row exists (id == auth user id). */
export async function ensureAccount(userId: string, displayName: string): Promise<Account> {
  const { data, error } = await supabase
    .from('accounts')
    .upsert({ id: userId, display_name: displayName.trim() || 'You' }, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return mapAccount(data);
}

export async function getAccount(userId: string): Promise<Account | null> {
  const { data, error } = await supabase.from('accounts').select().eq('id', userId).maybeSingle();
  if (error) throw error;
  return data ? mapAccount(data) : null;
}

export interface InitialTreeInput {
  accountId: string;
  selfName: string;
  lovedOneName: string;
  relationshipType: RelationshipType;
  isRemembered: boolean;
}

export interface TreeBundle {
  tree: FamilyTree;
  nodes: FamilyNode[];
  relationships: Relationship[];
  memories: Memory[];
  suggestedEdits: SuggestedEdit[];
}

/**
 * Persist the onboarding result: a Family Tree, the creator's membership,
 * the self node (claimed), the first loved one (placeholder/managed), and the
 * approved relationship between them.
 */
export async function createInitialTree(input: InitialTreeInput): Promise<TreeBundle> {
  const { accountId, selfName, lovedOneName, relationshipType, isRemembered } = input;

  const { data: treeRow, error: treeErr } = await supabase
    .from('family_trees')
    .insert({ name: 'My Family Tree', created_by_account_id: accountId, default_visibility: 'family_tree' })
    .select()
    .single();
  if (treeErr) throw treeErr;

  const { error: memErr } = await supabase
    .from('tree_memberships')
    .insert({ family_tree_id: treeRow.id, account_id: accountId, role: 'creator' });
  if (memErr) throw memErr;

  const { data: selfRow, error: selfErr } = await supabase
    .from('nodes')
    .insert({
      family_tree_id: treeRow.id,
      owner_account_id: accountId,
      display_name: selfName.trim() || 'You',
      status: 'claimed',
      is_living: true,
      profile: seedProfile(selfName.trim() || 'You', 'owner', accountId) as unknown as Json,
    })
    .select()
    .single();
  if (selfErr) throw selfErr;

  const { data: lovedRow, error: lovedErr } = await supabase
    .from('nodes')
    .insert({
      family_tree_id: treeRow.id,
      display_name: lovedOneName.trim() || 'Loved one',
      status: nodeStatusFor(relationshipType, isRemembered),
      is_living: isLivingFor(relationshipType, isRemembered),
      profile: seedProfile(lovedOneName.trim() || 'Loved one', 'guardian', accountId) as unknown as Json,
    })
    .select()
    .single();
  if (lovedErr) throw lovedErr;

  const { data: relRow, error: relErr } = await supabase
    .from('relationships')
    .insert({
      family_tree_id: treeRow.id,
      from_node_id: selfRow.id,
      to_node_id: lovedRow.id,
      relationship_type: relationshipType,
      status: 'approved',
      created_by_account_id: accountId,
    })
    .select()
    .single();
  if (relErr) throw relErr;

  return {
    tree: mapTree(treeRow),
    nodes: [mapNode(selfRow), mapNode(lovedRow)],
    relationships: [mapRelationship(relRow)],
    memories: [],
    suggestedEdits: [],
  };
}

export interface AddRelativeInput {
  treeId: string;
  accountId: string;
  /** The node the new relative connects to (usually the signed-in user's node). */
  fromNodeId: string;
  name: string;
  relationshipType: RelationshipType;
  isRemembered: boolean;
  /** Optional family tags, e.g. ['Unknown link'] for an unclear connection. */
  tags?: string[];
}

export interface AddRelativeResult {
  node: FamilyNode;
  relationship: Relationship;
}

/** Add a new family member: a node plus an approved relationship to `fromNodeId`. */
export async function addRelative(input: AddRelativeInput): Promise<AddRelativeResult> {
  const { treeId, accountId, fromNodeId, name, relationshipType, isRemembered, tags } = input;

  const { data: nodeRow, error: nodeErr } = await supabase
    .from('nodes')
    .insert({
      family_tree_id: treeId,
      display_name: name.trim() || 'Family member',
      status: nodeStatusFor(relationshipType, isRemembered),
      is_living: isLivingFor(relationshipType, isRemembered),
      profile: seedProfile(name.trim() || 'Family member', 'guardian', accountId) as unknown as Json,
      ...(tags && tags.length ? { tags } : null),
    })
    .select()
    .single();
  if (nodeErr) throw nodeErr;

  const { data: relRow, error: relErr } = await supabase
    .from('relationships')
    .insert({
      family_tree_id: treeId,
      from_node_id: fromNodeId,
      to_node_id: nodeRow.id,
      relationship_type: relationshipType,
      status: 'approved',
      created_by_account_id: accountId,
    })
    .select()
    .single();
  if (relErr) throw relErr;

  return { node: mapNode(nodeRow), relationship: mapRelationship(relRow) };
}

/** Change the relationship type between an existing relationship's endpoints. */
export async function updateRelationshipType(
  relationshipId: string,
  relationshipType: RelationshipType,
): Promise<Relationship> {
  const { data, error } = await supabase
    .from('relationships')
    .update({ relationship_type: relationshipType })
    .eq('id', relationshipId)
    .select()
    .single();
  if (error) throw error;
  return mapRelationship(data);
}

/** Set or clear the wedding / partnership date on a spouse or partner connection. */
export async function updateRelationshipWeddingDate(
  relationshipId: string,
  weddingDate: string | null,
): Promise<Relationship> {
  const { data, error } = await supabase
    .from('relationships')
    .update({ wedding_date: weddingDate })
    .eq('id', relationshipId)
    .select()
    .single();
  if (error) throw error;
  return mapRelationship(data);
}

/** Create a relationship edge between two existing nodes. */
export async function createRelationship(input: {
  treeId: string;
  accountId: string;
  fromNodeId: string;
  toNodeId: string;
  relationshipType: RelationshipType;
}): Promise<Relationship> {
  const { data, error } = await supabase
    .from('relationships')
    .insert({
      family_tree_id: input.treeId,
      from_node_id: input.fromNodeId,
      to_node_id: input.toNodeId,
      relationship_type: input.relationshipType,
      status: 'approved',
      created_by_account_id: input.accountId,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRelationship(data);
}

/** Remove a single relationship edge. */
export async function deleteRelationship(relationshipId: string): Promise<void> {
  const { error } = await supabase.from('relationships').delete().eq('id', relationshipId);
  if (error) throw error;
}

/**
 * Permanently remove a node the user created (not yet claimed). Dependent
 * relationships and memories are deleted first since they have no cascade.
 */
export async function deleteNode(nodeId: string): Promise<void> {
  await supabase.from('memories').delete().eq('node_id', nodeId);
  await supabase.from('relationships').delete().or(`from_node_id.eq.${nodeId},to_node_id.eq.${nodeId}`);
  const { error } = await supabase.from('nodes').delete().eq('id', nodeId);
  if (error) throw error;
}

/** Update a tree's privacy settings (default visibility + public sharing). */
export async function updateTreePrivacy(
  treeId: string,
  patch: { defaultVisibility: VisibilityLevel; publicSharingEnabled: boolean },
): Promise<FamilyTree> {
  const { data, error } = await supabase
    .from('family_trees')
    .update({
      default_visibility: patch.defaultVisibility,
      public_sharing_enabled: patch.publicSharingEnabled,
    })
    .eq('id', treeId)
    .select()
    .single();
  if (error) throw error;
  return mapTree(data);
}

/** Load the signed-in user's primary tree and all of its content. */
export async function loadMyTreeBundle(accountId: string): Promise<TreeBundle | null> {
  // Resolve via membership so claimed/joined members see their tree, not only creators.
  const { data: memberships, error: memErr } = await supabase
    .from('tree_memberships')
    .select('family_tree_id, role, created_at')
    .eq('account_id', accountId)
    .order('created_at', { ascending: true });
  if (memErr) throw memErr;

  let treeRow: Tables<'family_trees'> | null = null;

  const membership = memberships?.find((m) => m.role === 'creator') ?? memberships?.[0];
  if (membership) {
    const { data, error } = await supabase.from('family_trees').select().eq('id', membership.family_tree_id).maybeSingle();
    if (error) throw error;
    treeRow = data;
  }

  // Legacy fallback for trees created before memberships were recorded.
  if (!treeRow) {
    const { data: trees, error: treeErr } = await supabase
      .from('family_trees')
      .select()
      .eq('created_by_account_id', accountId)
      .order('created_at', { ascending: true })
      .limit(1);
    if (treeErr) throw treeErr;
    treeRow = trees?.[0] ?? null;
  }

  if (!treeRow) return null;

  const [nodesRes, relsRes, memsRes, suggestionsRes] = await Promise.all([
    supabase.from('nodes').select().eq('family_tree_id', treeRow.id).order('created_at'),
    supabase.from('relationships').select().eq('family_tree_id', treeRow.id),
    supabase.from('memories').select().eq('family_tree_id', treeRow.id).order('created_at', { ascending: false }),
    supabase.from('suggested_edits').select().eq('family_tree_id', treeRow.id).order('created_at', { ascending: false }),
  ]);
  if (nodesRes.error) throw nodesRes.error;
  if (relsRes.error) throw relsRes.error;
  if (memsRes.error) throw memsRes.error;
  if (suggestionsRes.error) throw suggestionsRes.error;

  return {
    tree: mapTree(treeRow),
    nodes: (nodesRes.data ?? []).map(mapNode),
    relationships: (relsRes.data ?? []).map(mapRelationship),
    memories: (memsRes.data ?? []).map(mapMemory),
    suggestedEdits: (suggestionsRes.data ?? []).map(mapSuggestedEdit),
  };
}
