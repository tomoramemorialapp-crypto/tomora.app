/**
 * Tomora core data models. Mirrors the brief's TypeScript sketch and the
 * relational schema so it stays compatible with the future Supabase backend.
 */

export type VisibilityLevel =
  | 'private'
  | 'selected_people'
  | 'family_tree'
  | 'invite_link'
  | 'public';

export type NodeStatus =
  | 'placeholder'
  | 'invited'
  | 'claim_pending'
  | 'claimed'
  | 'managed'
  | 'memorial_pending'
  | 'memory_light'
  | 'disputed'
  | 'vacated'
  | 'archived'
  | 'deleted';

/** Lifecycle of an account itself (used by the deletion grace period). */
export type AccountStatus = 'active' | 'vacated';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface SocialLinks {
  website?: string;
  instagram?: string;
  facebook?: string;
  x?: string;
  linkedin?: string;
  [key: string]: string | undefined;
}

export type RelationshipStatus =
  | 'proposed'
  | 'pending_approval'
  | 'approved'
  | 'private_approved'
  | 'rejected'
  | 'disputed';

export type RelationshipDetail =
  | 'father'
  | 'mother'
  | 'adoptive_father'
  | 'adoptive_mother'
  | 'stepfather'
  | 'stepmother'
  | 'father_in_law'
  | 'mother_in_law'
  | 'son'
  | 'daughter'
  | 'adopted_son'
  | 'adopted_daughter'
  | 'step_son'
  | 'step_daughter'
  | 'son_in_law'
  | 'daughter_in_law'
  | 'brother'
  | 'sister'
  | 'half_brother'
  | 'half_sister'
  | 'step_brother'
  | 'step_sister'
  | 'brother_in_law'
  | 'sister_in_law'
  | 'grandfather'
  | 'grandmother'
  | 'paternal_grandfather'
  | 'paternal_grandmother'
  | 'maternal_grandfather'
  | 'maternal_grandmother'
  | 'step_grandfather'
  | 'step_grandmother'
  | 'grandson'
  | 'granddaughter'
  | 'uncle'
  | 'aunt'
  | 'paternal_uncle'
  | 'paternal_aunt'
  | 'maternal_uncle'
  | 'maternal_aunt'
  | 'uncle_by_marriage'
  | 'aunt_by_marriage'
  | 'nephew'
  | 'niece'
  | 'step_nephew'
  | 'step_niece'
  | 'cousin_male'
  | 'cousin_female'
  | 'husband'
  | 'wife'
  | 'former_husband'
  | 'former_wife'
  | 'former_partner';

export type RelationshipType =
  | 'self'
  | 'parent'
  | 'step_parent'
  | 'parent_in_law'
  | 'child'
  | 'child_in_law'
  | 'sibling'
  | 'grandparent'
  | 'grandchild'
  | 'aunt_uncle'
  | 'niece_nephew'
  | 'cousin'
  | 'spouse'
  | 'partner'
  | 'friend'
  | 'pet'
  | 'caretaker'
  | 'chosen_family'
  | 'other';

export type TreeRole =
  | 'creator'
  | 'guardian'
  | 'branch_guardian'
  | 'member'
  | 'keeper'
  | 'viewer'
  | 'guest';

export type MemoryType = 'text' | 'photo' | 'video' | 'audio' | 'document' | 'link';
export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected';

/** Owner-controlled config for the shareable public (social) profile page. */
export interface PublicProfileConfig {
  enabled: boolean;
  bio?: string;
  /** Header image URL for the public page. */
  bannerUrl?: string;
  showSocial: boolean;
  showMemories: boolean;
  /** When true, Life Profile fields marked `public` appear on the shareable page. */
  showLifeProfile: boolean;
  /** Curated memory ids; empty = all eligible public / link-shared memories. */
  featuredMemoryIds?: string[];
}

export interface Account {
  id: string;
  email?: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  socialLinks: SocialLinks;
  language: string;
  themePreference: ThemePreference;
  inviteCode?: string;
  status: AccountStatus;
  /** Owner-editable public profile settings (stored under preferences). */
  publicProfile: PublicProfileConfig;
  /** Timestamps of past username changes (max 2 per rolling 30 days). */
  usernameChanges: string[];
  /** When the user requested deletion (start of the 30-day grace period). */
  deletionRequestedAt?: string;
  /** When the account + owned data will be permanently purged. */
  deletionScheduledFor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyTree {
  id: string;
  name: string;
  createdByAccountId: string;
  defaultVisibility: VisibilityLevel;
  publicSharingEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyNode {
  id: string;
  familyTreeId: string;
  ownerAccountId?: string;
  managedByAccountId?: string;
  displayName: string;
  legalName?: string;
  avatarUrl?: string;
  status: NodeStatus;
  isLiving?: boolean;
  birthDate?: string;
  deathDate?: string;
  city?: string;
  country?: string;
  defaultVisibility: VisibilityLevel;
  /** Rich, field-level editable profile (provenance + per-field visibility). */
  profile: import('./profile').NodeProfile;
  /** Free-form family tags used for filtering the Family Tree. */
  tags: string[];
  /** Invite code for an unclaimed node (used to claim it). */
  inviteCode?: string;
  /** Optional claim password the inviter set on an unclaimed node. */
  claimPassword?: string;
  /** Other names this person was known by (shown on the memorial page). */
  alternateNames: string[];
  /** Memorial / tribute page fields (used once the node is a Memory Light). */
  memorialBannerUrl?: string;
  memorialBio?: string;
  memorialTitle?: string;
  memorialLinkLabel?: string;
  memorialLinkUrl?: string;
  /** Who can view the shareable memorial page. */
  memorialPrivacy: MemorialPrivacy;
  /** When set, the node is soft-deleted and excluded from active UI. */
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/** Visibility of the shareable memorial/tribute page. */
export type MemorialPrivacy = 'family' | 'semi' | 'public';

export interface Relationship {
  id: string;
  familyTreeId: string;
  fromNodeId: string;
  toNodeId: string;
  relationshipType: RelationshipType;
  /** Gender-specific label from `from` node's perspective (e.g. father-in-law, son-in-law). */
  relationshipDetail?: RelationshipDetail;
  status: RelationshipStatus;
  visibility: VisibilityLevel;
  /** ISO date (YYYY-MM-DD or YYYY-MM) for spouse/partner connections. */
  weddingDate?: string;
  createdByAccountId: string;
  createdAt: string;
  updatedAt: string;
}

/** A single uploaded media item inside a memory (a memory can hold several). */
export interface MemoryMediaItem {
  storagePath: string;
  sizeBytes: number;
  mime?: string;
  kind: 'photo' | 'video' | 'audio' | 'document';
  name?: string;
}

export interface Memory {
  id: string;
  familyTreeId: string;
  nodeId?: string;
  occasionId?: string;
  createdByAccountId: string;
  type: MemoryType;
  title?: string;
  /** Rich-text story body (used by `text` memories). */
  body?: string;
  /** Short caption shown for media/link memories (everything except a Story). */
  caption?: string;
  /** External link (for `link` memories) or a resolvable media URL. */
  mediaUrl?: string;
  /** Multiple uploaded media items (photos, videos, audio, files). */
  media: MemoryMediaItem[];
  /** Family members tagged in this memory (each links to a Life Profile). */
  taggedNodeIds: string[];
  /** Legacy single-file path (kept for back-compat with older memories). */
  storagePath?: string;
  /** Total uploaded media bytes across this memory (used by the storage tracker). */
  mediaSizeBytes?: number;
  /** MIME type of the legacy single uploaded file. */
  mediaMime?: string;
  visibility: VisibilityLevel;
  approvalStatus: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'new_member'
  | 'invite'
  | 'request'
  | 'suggested_edit'
  | 'dispute'
  | 'access'
  | 'memorial_pending'
  | 'memorial_created'
  | 'memorial_disputed'
  | 'system';

export interface Notification {
  id: string;
  familyTreeId: string;
  recipientAccountId: string;
  actorAccountId?: string;
  type: NotificationType;
  title: string;
  body?: string;
  nodeId?: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export type MemorialRequestStatus = 'pending' | 'finalized' | 'disputed' | 'cancelled';

export interface MemorialRequest {
  id: string;
  nodeId: string;
  familyTreeId: string;
  requestedByAccountId: string;
  status: MemorialRequestStatus;
  deathDate?: string;
  reason?: string;
  resolveAfter: string;
  createdAt: string;
  updatedAt: string;
}
