import type { RelationshipDetail } from '@/lib/relationshipDetail';
import type {
  Account,
  FamilyTree,
  FamilyNode,
  Memory,
  MemorialPrivacy,
  MemorialRequest,
  MemorialRequestStatus,
  Notification,
  NotificationType,
  Relationship,
  NodeStatus,
  RelationshipStatus,
  RelationshipType,
  VisibilityLevel,
  MemoryType,
  ApprovalStatus,
  ThemePreference,
} from '@/types/models';
import type {
  ChangeLogAction,
  NodeProfile,
  ProfileChangeLog,
  ProfileFieldKey,
  SuggestedEdit,
  SuggestedEditStatus,
} from '@/types/profile';
import type { Tables } from '@/types/database.types';

/** Map Supabase rows (snake_case) to the app's camelCase domain models. */

function normalizeThemePreference(value: string | null | undefined): ThemePreference {
  return value === 'dark' ? 'dark' : 'light';
}

export function mapAccount(row: Tables<'accounts'>): Account {
  const prefs = (row.preferences ?? {}) as { publicProfile?: Partial<Account['publicProfile']> };
  const pp = prefs.publicProfile ?? {};
  return {
    id: row.id,
    displayName: row.display_name,
    username: row.username ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    socialLinks: (row.social_links as Account['socialLinks']) ?? {},
    language: row.language ?? 'en',
    themePreference: normalizeThemePreference(row.theme_preference),
    inviteCode: row.invite_code ?? undefined,
    status: (row.status as Account['status']) ?? 'active',
    publicProfile: {
      enabled: pp.enabled ?? false,
      bio: pp.bio ?? '',
      showSocial: pp.showSocial ?? true,
      showMemories: pp.showMemories ?? true,
    },
    usernameChanges: row.username_changes ?? [],
    deletionRequestedAt: row.deletion_requested_at ?? undefined,
    deletionScheduledFor: row.deletion_scheduled_for ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTree(row: Tables<'family_trees'>): FamilyTree {
  return {
    id: row.id,
    name: row.name,
    createdByAccountId: row.created_by_account_id,
    defaultVisibility: row.default_visibility as VisibilityLevel,
    publicSharingEnabled: row.public_sharing_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapNode(row: Tables<'nodes'>): FamilyNode {
  return {
    id: row.id,
    familyTreeId: row.family_tree_id,
    ownerAccountId: row.owner_account_id ?? undefined,
    managedByAccountId: row.managed_by_account_id ?? undefined,
    displayName: row.display_name,
    legalName: row.legal_name ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    status: row.status as NodeStatus,
    isLiving: row.is_living ?? undefined,
    birthDate: row.birth_date ?? undefined,
    deathDate: row.death_date ?? undefined,
    city: row.city ?? undefined,
    country: row.country ?? undefined,
    defaultVisibility: row.default_visibility as VisibilityLevel,
    profile: (row.profile as NodeProfile) ?? {},
    tags: row.tags ?? [],
    inviteCode: row.invite_code ?? undefined,
    claimPassword: row.claim_password ?? undefined,
    alternateNames: row.alternate_names ?? [],
    memorialBannerUrl: row.memorial_banner_url ?? undefined,
    memorialBio: row.memorial_bio ?? undefined,
    memorialTitle: row.memorial_title ?? undefined,
    memorialLinkLabel: row.memorial_link_label ?? undefined,
    memorialLinkUrl: row.memorial_link_url ?? undefined,
    memorialPrivacy: (row.memorial_privacy as MemorialPrivacy) ?? 'family',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRelationship(row: Tables<'relationships'>): Relationship {
  return {
    id: row.id,
    familyTreeId: row.family_tree_id,
    fromNodeId: row.from_node_id,
    toNodeId: row.to_node_id,
    relationshipType: row.relationship_type as RelationshipType,
    relationshipDetail: (row.relationship_detail as RelationshipDetail | null) ?? undefined,
    status: row.status as RelationshipStatus,
    visibility: row.visibility as VisibilityLevel,
    weddingDate: row.wedding_date ?? undefined,
    createdByAccountId: row.created_by_account_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapChangeLog(row: Tables<'node_change_log'>): ProfileChangeLog {
  return {
    id: row.id,
    targetNodeId: row.node_id,
    familyTreeId: row.family_tree_id,
    fieldKey: (row.field_key as ProfileFieldKey) ?? undefined,
    action: row.action as ChangeLogAction,
    previousValue: row.previous_value ?? undefined,
    newValue: row.new_value ?? undefined,
    performedByAccountId: row.performed_by_account_id,
    note: row.note ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapSuggestedEdit(row: Tables<'suggested_edits'>): SuggestedEdit {
  return {
    id: row.id,
    familyTreeId: row.family_tree_id,
    targetNodeId: row.target_node_id,
    targetProfileFieldKey: row.field_key as ProfileFieldKey,
    currentValueSnapshot: row.current_value_snapshot ?? undefined,
    suggestedValue: row.suggested_value ?? undefined,
    suggestedByAccountId: row.suggested_by_account_id,
    suggestedAt: row.created_at,
    reason: row.reason ?? undefined,
    status: row.status as SuggestedEditStatus,
    reviewedByAccountId: row.reviewed_by_account_id ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewNote: row.review_note ?? undefined,
  };
}

export function mapMemory(row: Tables<'memories'>): Memory {
  return {
    id: row.id,
    familyTreeId: row.family_tree_id,
    nodeId: row.node_id ?? undefined,
    occasionId: row.occasion_id ?? undefined,
    createdByAccountId: row.created_by_account_id,
    type: row.type as MemoryType,
    title: row.title ?? undefined,
    body: row.body ?? undefined,
    caption: row.caption ?? undefined,
    mediaUrl: row.media_url ?? undefined,
    media: Array.isArray(row.media) ? (row.media as unknown as Memory['media']) : [],
    taggedNodeIds: row.tagged_node_ids ?? [],
    storagePath: row.storage_path ?? undefined,
    mediaSizeBytes: row.media_size_bytes ?? undefined,
    mediaMime: row.media_mime ?? undefined,
    visibility: row.visibility as VisibilityLevel,
    approvalStatus: row.approval_status as ApprovalStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapNotification(row: Tables<'notifications'>): Notification {
  return {
    id: row.id,
    familyTreeId: row.family_tree_id,
    recipientAccountId: row.recipient_account_id,
    actorAccountId: row.actor_account_id ?? undefined,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body ?? undefined,
    nodeId: row.node_id ?? undefined,
    data: (row.data as Record<string, unknown>) ?? {},
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export function mapMemorialRequest(row: Tables<'memorial_requests'>): MemorialRequest {
  return {
    id: row.id,
    nodeId: row.node_id,
    familyTreeId: row.family_tree_id,
    requestedByAccountId: row.requested_by_account_id,
    status: row.status as MemorialRequestStatus,
    deathDate: row.death_date ?? undefined,
    reason: row.reason ?? undefined,
    resolveAfter: row.resolve_after,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
