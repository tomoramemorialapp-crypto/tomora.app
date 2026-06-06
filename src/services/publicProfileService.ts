import { supabase } from '@/lib/supabase';
import type { SocialLinks } from '@/types/models';

/** A public memory teaser shown on a social profile. */
export interface PublicMemory {
  id: string;
  type: string;
  title?: string;
  caption?: string;
  mediaUrl?: string;
  createdAt: string;
}

/** The owner-curated public profile, as seen by anyone with the link. */
export interface PublicProfileView {
  displayName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  socialLinks: SocialLinks;
  memories: PublicMemory[];
}

interface RawPublicProfile {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  bio: string;
  socialLinks: SocialLinks;
  memories: {
    id: string;
    type: string;
    title: string | null;
    caption: string | null;
    media_url: string | null;
    created_at: string;
  }[];
}

/**
 * Fetch a user's public social profile by username. Returns null when the
 * username doesn't exist or the owner hasn't made their profile public.
 */
export async function getPublicProfile(username: string): Promise<PublicProfileView | null> {
  const { data, error } = await supabase.rpc('get_public_profile', { p_username: username });
  if (error) throw new Error(error.message);
  if (!data) return null;
  const raw = data as unknown as RawPublicProfile;
  return {
    displayName: raw.displayName,
    username: raw.username,
    avatarUrl: raw.avatarUrl ?? undefined,
    bio: raw.bio || undefined,
    socialLinks: raw.socialLinks ?? {},
    memories: (raw.memories ?? []).map((m) => ({
      id: m.id,
      type: m.type,
      title: m.title ?? undefined,
      caption: m.caption ?? undefined,
      mediaUrl: m.media_url ?? undefined,
      createdAt: m.created_at,
    })),
  };
}
