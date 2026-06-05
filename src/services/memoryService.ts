import { supabase } from '@/lib/supabase';
import type { Memory, MemoryType, VisibilityLevel } from '@/types/models';
import { removeMedia } from '@/lib/media';
import type { TablesUpdate } from '@/types/database.types';
import { mapMemory } from './mappers';

export interface CreateMemoryInput {
  familyTreeId: string;
  nodeId: string;
  accountId: string;
  type: MemoryType;
  title?: string;
  body?: string;
  /** External link for `link` memories. */
  mediaUrl?: string;
  /** Storage path + metadata for device uploads. */
  storagePath?: string;
  mediaSizeBytes?: number;
  mediaMime?: string;
  visibility: VisibilityLevel;
}

/** Save a memory (text, link, or uploaded media) and return the created row. */
export async function createMemory(input: CreateMemoryInput): Promise<Memory> {
  const { data, error } = await supabase
    .from('memories')
    .insert({
      family_tree_id: input.familyTreeId,
      node_id: input.nodeId,
      created_by_account_id: input.accountId,
      type: input.type,
      title: input.title?.trim() || null,
      body: input.body?.trim() || null,
      media_url: input.mediaUrl?.trim() || null,
      storage_path: input.storagePath ?? null,
      media_size_bytes: input.mediaSizeBytes ?? null,
      media_mime: input.mediaMime ?? null,
      visibility: input.visibility,
      approval_status: 'approved',
    })
    .select()
    .single();
  if (error) throw error;
  return mapMemory(data);
}

/** Back-compat helper for plain text memories. */
export async function addTextMemory(input: {
  familyTreeId: string;
  nodeId: string;
  accountId: string;
  title?: string;
  body: string;
  visibility: VisibilityLevel;
}): Promise<Memory> {
  return createMemory({ ...input, type: 'text' });
}

export interface UpdateMemoryInput {
  id: string;
  title?: string;
  body?: string;
  visibility?: VisibilityLevel;
}

/** Edit an existing memory's title, story, or visibility. */
export async function updateMemory(input: UpdateMemoryInput): Promise<Memory> {
  const patch: TablesUpdate<'memories'> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) patch.title = input.title.trim() || null;
  if (input.body !== undefined) patch.body = input.body.trim() || null;
  if (input.visibility !== undefined) patch.visibility = input.visibility;

  const { data, error } = await supabase
    .from('memories')
    .update(patch)
    .eq('id', input.id)
    .select()
    .single();
  if (error) throw error;
  return mapMemory(data);
}

/** Delete a memory and its uploaded media (if any). */
export async function deleteMemory(memory: Pick<Memory, 'id' | 'storagePath'>): Promise<void> {
  if (memory.storagePath) await removeMedia(memory.storagePath);
  const { error } = await supabase.from('memories').delete().eq('id', memory.id);
  if (error) throw error;
}

/** Total bytes of uploaded media across every memory this account created. */
export async function getAccountMediaUsage(accountId: string): Promise<number> {
  const { data, error } = await supabase
    .from('memories')
    .select('media_size_bytes')
    .eq('created_by_account_id', accountId);
  if (error) throw error;
  return (data ?? []).reduce((sum, r) => sum + (r.media_size_bytes ?? 0), 0);
}
