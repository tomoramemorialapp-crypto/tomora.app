import { userMessageFromError } from '@/lib/userErrors';
import { supabase } from '@/lib/supabase';
import {
  friendlyPublicMemoryUnlockError,
  mapPublicMemoryMedia,
  normalizePublicUsernameParam,
} from '@/lib/publicProfile';
import { publicLifeProfileFields } from '@/lib/publicProfileFields';
import type { NodeProfile } from '@/types/profile';
import type { MemoryMediaItem, SocialLinkItem, SocialLinks } from '@/types/models';
import { publicSocialLinkItems } from '@/lib/socialLinks';

/** A public memory teaser shown on a social profile. */
export interface PublicMemory {
  id: string;
  type: string;
  title?: string;
  body?: string;
  caption?: string;
  mediaUrl?: string;
  media: MemoryMediaItem[];
  storagePath?: string;
  createdAt: string;
  visibility: string;
  requiresPassword: boolean;
}

export interface UnlockedPublicMemory {
  id: string;
  type: string;
  title?: string;
  body?: string;
  caption?: string;
  mediaUrl?: string;
  media: MemoryMediaItem[];
  storagePath?: string;
  createdAt: string;
}

/** The owner-curated public profile, as seen by anyone with the link. */
export interface PublicProfileView {
  displayName: string;
  username: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  socialLinks: SocialLinks;
  socialLinkItems: SocialLinkItem[];
  showLifeProfile: boolean;
  lifeProfileFields: { key: string; label: string; value: string }[];
  memories: PublicMemory[];
}

interface RawPublicProfile {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  showLifeProfile?: boolean;
  socialLinks: SocialLinks;
  lifeProfile?: NodeProfile;
  memories: {
    id: string;
    type: string;
    title: string | null;
    body: string | null;
    caption: string | null;
    media_url: string | null;
    media: unknown;
    storage_path: string | null;
    created_at: string;
    visibility: string;
    requires_password: boolean;
  }[];
}

/**
 * Fetch a user's public social profile by username. Returns null when the
 * username doesn't exist or the owner hasn't made their profile public.
 */
export async function getPublicProfile(username: string): Promise<PublicProfileView | null> {
  const normalized = normalizePublicUsernameParam(username);
  if (!normalized) return null;

  const { data, error } = await supabase.rpc('get_public_profile', { p_username: normalized });
  if (error) throw new Error(userMessageFromError(error, 'Could not load this profile.', 'general'));
  if (!data) return null;
  const raw = data as unknown as RawPublicProfile;
  const lifeProfile = (raw.lifeProfile ?? {}) as NodeProfile;
  return {
    displayName: raw.displayName,
    username: raw.username,
    avatarUrl: raw.avatarUrl ?? undefined,
    bannerUrl: raw.bannerUrl ?? undefined,
    bio: raw.bio || undefined,
    socialLinks: raw.socialLinks ?? {},
    socialLinkItems: publicSocialLinkItems(raw.socialLinks),
    showLifeProfile: raw.showLifeProfile ?? true,
    lifeProfileFields: publicLifeProfileFields(lifeProfile).map((f) => ({
      key: f.key,
      label: f.label,
      value: f.value,
    })),
    memories: (raw.memories ?? []).map((m) => ({
      id: m.id,
      type: m.type,
      title: m.title ?? undefined,
      body: m.body ?? undefined,
      caption: m.caption ?? undefined,
      mediaUrl: m.media_url ?? undefined,
      media: mapPublicMemoryMedia(m.media),
      storagePath: m.storage_path ?? undefined,
      createdAt: m.created_at,
      visibility: m.visibility,
      requiresPassword: !!m.requires_password,
    })),
  };
}

/** Open a password-gated memory that is featured on a public profile. */
export async function unlockPublicMemory(memoryId: string, password: string): Promise<UnlockedPublicMemory> {
  const { data, error } = await supabase.rpc('unlock_public_memory', {
    p_memory_id: memoryId,
    p_password: password,
  });
  if (error) throw new Error(friendlyPublicMemoryUnlockError(error.message));
  const raw = (data ?? {}) as {
    id: string;
    type: string;
    title: string | null;
    body: string | null;
    caption: string | null;
    media_url: string | null;
    media: unknown;
    storage_path: string | null;
    created_at: string;
  };
  return {
    id: raw.id,
    type: raw.type,
    title: raw.title ?? undefined,
    body: raw.body ?? undefined,
    caption: raw.caption ?? undefined,
    mediaUrl: raw.media_url ?? undefined,
    media: mapPublicMemoryMedia(raw.media),
    storagePath: raw.storage_path ?? undefined,
    createdAt: raw.created_at,
  };
}

/** Set or clear the share password on an owner memory (public / invite_link). */
export async function setMemorySharePassword(memoryId: string, password: string | null): Promise<void> {
  const { error } = await supabase.rpc('set_memory_share_password', {
    p_memory_id: memoryId,
    p_password: password ?? '',
  });
  if (error) throw new Error(userMessageFromError(error, 'Could not load this profile.', 'general'));
}
