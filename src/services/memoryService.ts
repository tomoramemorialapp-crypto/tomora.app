import { supabase } from '@/lib/supabase';
import type { Memory, MemoryMediaItem, MemoryType, VisibilityLevel } from '@/types/models';
import { removeMedia } from '@/lib/media';
import type { Json, TablesUpdate } from '@/types/database.types';
import { mapMemory } from './mappers';

export interface CreateMemoryInput {
  familyTreeId: string;
  nodeId: string;
  accountId: string;
  type: MemoryType;
  title?: string;
  /** Rich-text story (text memories). */
  body?: string;
  /** Caption for media/link memories. */
  caption?: string;
  /** External link for `link` memories. */
  mediaUrl?: string;
  /** One or more uploaded media items (photos, videos, audio, files). */
  media?: MemoryMediaItem[];
  /** Family members tagged in this memory. */
  taggedNodeIds?: string[];
  visibility: VisibilityLevel;
}

/** Save a memory (text, link, or one/many uploaded media) and return the row. */
export async function createMemory(input: CreateMemoryInput): Promise<Memory> {
  const media = input.media ?? [];
  const totalBytes = media.reduce((s, m) => s + (m.sizeBytes || 0), 0);
  if (totalBytes > 0) {
    const { error: quotaErr } = await supabase.rpc('assert_storage_quota', {
      p_account_id: input.accountId,
      p_add_bytes: totalBytes,
    });
    if (quotaErr) {
      if (quotaErr.message.includes('STORAGE_QUOTA_EXCEEDED')) {
        throw new Error('You have reached your media storage limit. Remove some memories to free space.');
      }
      throw quotaErr;
    }
  }
  const first = media[0];
  let data;
  try {
    const result = await supabase
      .from('memories')
      .insert({
        family_tree_id: input.familyTreeId,
        node_id: input.nodeId,
        created_by_account_id: input.accountId,
        type: input.type,
        title: input.title?.trim() || null,
        body: input.body?.trim() || null,
        caption: input.caption?.trim() || null,
        media_url: input.mediaUrl?.trim() || null,
        media: media as unknown as Json,
        tagged_node_ids: input.taggedNodeIds ?? [],
        storage_path: first?.storagePath ?? null,
        media_size_bytes: totalBytes || null,
        media_mime: first?.mime ?? null,
        visibility: input.visibility,
        approval_status: 'approved',
      })
      .select()
      .single();
    if (result.error) throw result.error;
    data = result.data;
  } catch (e) {
    if (media.length) {
      await Promise.all(
        media.map((item) => removeMedia(item.storagePath).catch(() => undefined)),
      );
    }
    throw e;
  }
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
  caption?: string;
  taggedNodeIds?: string[];
  visibility?: VisibilityLevel;
}

/** Edit an existing memory's title, story/caption, tags, or visibility. */
export async function updateMemory(input: UpdateMemoryInput): Promise<Memory> {
  const patch: TablesUpdate<'memories'> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) patch.title = input.title.trim() || null;
  if (input.body !== undefined) patch.body = input.body.trim() || null;
  if (input.caption !== undefined) patch.caption = input.caption.trim() || null;
  if (input.taggedNodeIds !== undefined) patch.tagged_node_ids = input.taggedNodeIds;
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

/** Delete a memory and all of its uploaded media (if any). */
export async function deleteMemory(memory: Pick<Memory, 'id' | 'storagePath' | 'media'>): Promise<void> {
  const paths = [
    ...(memory.media ?? []).map((m) => m.storagePath),
    ...(memory.storagePath ? [memory.storagePath] : []),
  ].filter(Boolean) as string[];

  await Promise.all(paths.map((p) => removeMedia(p)));

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
