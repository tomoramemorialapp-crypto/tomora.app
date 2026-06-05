import { supabase } from '@/lib/supabase';
import type {
  Account,
  FamilyTree,
  FamilyNode,
  Memory,
  Relationship,
  RelationshipType,
} from '@/types/models';
import { mapAccount, mapMemory, mapNode, mapRelationship, mapTree } from './mappers';

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
    })
    .select()
    .single();
  if (selfErr) throw selfErr;

  const { data: lovedRow, error: lovedErr } = await supabase
    .from('nodes')
    .insert({
      family_tree_id: treeRow.id,
      display_name: lovedOneName.trim() || 'Loved one',
      status: isRemembered ? 'managed' : 'placeholder',
      is_living: !isRemembered,
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
  };
}

/** Load the signed-in user's primary tree and all of its content. */
export async function loadMyTreeBundle(accountId: string): Promise<TreeBundle | null> {
  const { data: trees, error: treeErr } = await supabase
    .from('family_trees')
    .select()
    .eq('created_by_account_id', accountId)
    .order('created_at', { ascending: true })
    .limit(1);
  if (treeErr) throw treeErr;
  const treeRow = trees?.[0];
  if (!treeRow) return null;

  const [nodesRes, relsRes, memsRes] = await Promise.all([
    supabase.from('nodes').select().eq('family_tree_id', treeRow.id).order('created_at'),
    supabase.from('relationships').select().eq('family_tree_id', treeRow.id),
    supabase.from('memories').select().eq('family_tree_id', treeRow.id).order('created_at', { ascending: false }),
  ]);
  if (nodesRes.error) throw nodesRes.error;
  if (relsRes.error) throw relsRes.error;
  if (memsRes.error) throw memsRes.error;

  return {
    tree: mapTree(treeRow),
    nodes: (nodesRes.data ?? []).map(mapNode),
    relationships: (relsRes.data ?? []).map(mapRelationship),
    memories: (memsRes.data ?? []).map(mapMemory),
  };
}
