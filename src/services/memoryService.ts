import { supabase } from '@/lib/supabase';
import type { Memory, VisibilityLevel } from '@/types/models';
import { mapMemory } from './mappers';

export interface AddTextMemoryInput {
  familyTreeId: string;
  nodeId: string;
  accountId: string;
  title?: string;
  body: string;
  visibility: VisibilityLevel;
}

/** Save a text memory and return the created row. */
export async function addTextMemory(input: AddTextMemoryInput): Promise<Memory> {
  const { data, error } = await supabase
    .from('memories')
    .insert({
      family_tree_id: input.familyTreeId,
      node_id: input.nodeId,
      created_by_account_id: input.accountId,
      type: 'text',
      title: input.title?.trim() || null,
      body: input.body.trim(),
      visibility: input.visibility,
      approval_status: 'approved',
    })
    .select()
    .single();
  if (error) throw error;
  return mapMemory(data);
}
