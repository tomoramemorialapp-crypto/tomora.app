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
  | 'archived';

export type RelationshipStatus =
  | 'proposed'
  | 'pending_approval'
  | 'approved'
  | 'private_approved'
  | 'rejected'
  | 'disputed';

export type RelationshipType =
  | 'self'
  | 'parent'
  | 'child'
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

export interface Account {
  id: string;
  email?: string;
  displayName: string;
  avatarUrl?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface Relationship {
  id: string;
  familyTreeId: string;
  fromNodeId: string;
  toNodeId: string;
  relationshipType: RelationshipType;
  status: RelationshipStatus;
  visibility: VisibilityLevel;
  createdByAccountId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Memory {
  id: string;
  familyTreeId: string;
  nodeId?: string;
  occasionId?: string;
  createdByAccountId: string;
  type: MemoryType;
  title?: string;
  body?: string;
  mediaUrl?: string;
  visibility: VisibilityLevel;
  approvalStatus: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
}
