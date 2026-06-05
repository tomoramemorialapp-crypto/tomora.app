import type { Account, TreeRole, VisibilityLevel } from '@/types/models';

/**
 * MVP permission check. Mirrors the brief's permission engine pseudocode.
 * Never assume that seeing a profile means seeing all memories/relationships —
 * each piece of content is checked by its own visibility.
 */
export function canViewContent({
  viewer,
  content,
  familyTreeMembership,
  explicitPermission,
}: {
  viewer: Account | null;
  content: { visibility: VisibilityLevel; createdByAccountId?: string };
  familyTreeMembership?: { role: TreeRole } | null;
  explicitPermission?: boolean;
}): boolean {
  if (content.visibility === 'public') return true;
  if (!viewer) return false;

  if (content.createdByAccountId === viewer.id) return true;
  if (explicitPermission) return true;

  if (content.visibility === 'family_tree') {
    return !!familyTreeMembership;
  }
  if (content.visibility === 'selected_people') {
    return explicitPermission === true;
  }
  if (content.visibility === 'invite_link') {
    return explicitPermission === true;
  }
  if (content.visibility === 'private') {
    return content.createdByAccountId === viewer.id;
  }
  return false;
}
