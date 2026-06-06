/**
 * Editable Life Profile data model.
 *
 * Implements the "Node Editing, Source of Truth, and Data Reconciliation" brief:
 * every editable field is a `ProfileField<T>` carrying its own value, visibility,
 * status, and provenance — so we can track who edited what, when, and whether a
 * value is confirmed, suggested, or disputed. The whole `NodeProfile` is stored
 * in the `nodes.profile` jsonb column; a few flat columns stay synced for legacy
 * reads (canvas, lists).
 */

import type { VisibilityLevel } from './models';

export type CertaintyLevel = 'exact' | 'approximate' | 'unknown' | 'disputed';

export interface DateValue {
  /** ISO date if exact: YYYY-MM-DD. */
  value?: string;
  yearOnly?: number;
  monthYearOnly?: string; // YYYY-MM
  displayText?: string; // e.g. "Around 1942"
  certainty: CertaintyLevel;
}

export interface PlaceReference {
  displayName: string;
  country?: string;
  region?: string;
  city?: string;
  /** Exact address — private by default. */
  address?: string;
  latitude?: number;
  longitude?: number;
  certainty: CertaintyLevel;
}

export interface GenderSexField {
  genderIdentity?: string;
  sexAssignedOrRecorded?: string;
  displayPreference?: 'show_gender' | 'show_sex' | 'show_both' | 'hide';
}

export interface NodeProfileHistoryFields {
  notes?: string;
  knownFor?: string[];
  lifeHistory?: string;
  occupationOrRole?: string[];
}

/** Structured personal name — replaces the legacy single full-name string. */
export interface PersonName {
  firstName: string;
  middleName?: string;
  surname?: string;
  suffix?: string;
}

export type FieldStatus =
  | 'draft'
  | 'confirmed'
  | 'pending_review'
  | 'suggested'
  | 'mismatch'
  | 'disputed'
  | 'superseded'
  | 'hidden';

export type FieldSourceType =
  | 'node_owner'
  | 'guardian'
  | 'caretaker'
  | 'family_member'
  | 'merged_tree'
  | 'imported_record'
  | 'system_inferred';

export interface FieldSource {
  sourceType: FieldSourceType;
  sourceAccountId?: string;
  sourceNodeId?: string;
  sourceFamilyTreeId?: string;
  sourceMergeId?: string;
  sourceNote?: string;
}

export interface ProfileField<T> {
  value: T;
  visibility: VisibilityLevel;
  status: FieldStatus;
  source: FieldSource;
  lastEditedByAccountId: string;
  lastEditedAt: string;
  verifiedByAccountIds?: string[];
  disputedByAccountIds?: string[];
  confidenceScore?: number;
}

/**
 * The stored profile. Each entry is optional because a node may have only a name
 * at first. `name` is conceptually required but kept optional here so partial
 * profiles deserialize safely.
 */
export interface NodeProfile {
  profilePhoto?: ProfileField<string>;
  name?: ProfileField<PersonName>;
  alternateNames?: ProfileField<string[]>;
  dateOfBirth?: ProfileField<DateValue>;
  dateOfDeath?: ProfileField<DateValue>;
  placeOfBirth?: ProfileField<PlaceReference>;
  placeOfDeath?: ProfileField<PlaceReference>;
  genderSex?: ProfileField<GenderSexField>;
  languages?: ProfileField<string[]>;
  notesHistory?: ProfileField<NodeProfileHistoryFields>;
}

export type ProfileFieldKey = keyof NodeProfile;

export const PROFILE_FIELD_KEYS: ProfileFieldKey[] = [
  'profilePhoto',
  'name',
  'alternateNames',
  'dateOfBirth',
  'dateOfDeath',
  'placeOfBirth',
  'placeOfDeath',
  'genderSex',
  'languages',
  'notesHistory',
];

export const PROFILE_FIELD_LABELS: Record<ProfileFieldKey, string> = {
  profilePhoto: 'Profile Photo',
  name: 'Name',
  alternateNames: 'Alternate, Nick, or Alias Names',
  dateOfBirth: 'Date of Birth',
  dateOfDeath: 'Date of Death',
  placeOfBirth: 'Place of Birth',
  placeOfDeath: 'Place of Death',
  genderSex: 'Gender / Sex',
  languages: 'Languages',
  notesHistory: 'Notes & History',
};

/** Ownership state of the real-person profile behind a node. */
export type NodeOwnershipState =
  | 'claimed_by_owner'
  | 'managed_by_guardian'
  | 'managed_by_caretaker'
  | 'unclaimed'
  | 'deceased_unclaimed'
  | 'memorial_guardian_managed'
  | 'disputed_ownership';

export type SuggestedEditStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'needs_more_info'
  | 'withdrawn'
  | 'merged_into_dispute';

export interface SuggestedEdit {
  id: string;
  familyTreeId: string;
  targetNodeId: string;
  targetProfileFieldKey: ProfileFieldKey;
  currentValueSnapshot: unknown;
  suggestedValue: unknown;
  suggestedByAccountId: string;
  suggestedAt: string;
  reason?: string;
  status: SuggestedEditStatus;
  reviewedByAccountId?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export type ChangeLogAction =
  | 'field_updated'
  | 'suggested_edit_submitted'
  | 'suggested_edit_approved'
  | 'suggested_edit_rejected'
  | 'duplicate_detected'
  | 'profiles_linked'
  | 'field_mismatch_created'
  | 'mismatch_resolved'
  | 'field_marked_disputed'
  | 'owner_override_applied'
  | 'field_visibility_changed'
  | 'tags_updated';

export interface ProfileChangeLog {
  id: string;
  targetNodeId: string;
  familyTreeId: string;
  fieldKey?: ProfileFieldKey | string;
  action: ChangeLogAction;
  previousValue?: unknown;
  newValue?: unknown;
  performedByAccountId: string;
  note?: string;
  createdAt: string;
}
