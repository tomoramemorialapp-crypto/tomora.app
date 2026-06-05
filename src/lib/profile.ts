/**
 * Profile editing helpers: permission resolution, field construction, value
 * formatting, and syncing the rich `NodeProfile` back to the flat `nodes`
 * columns the canvas/lists still read.
 */

import type { FamilyNode, VisibilityLevel } from '@/types/models';
import type {
  DateValue,
  FieldSourceType,
  GenderSexField,
  NodeOwnershipState,
  NodeProfile,
  PlaceReference,
  ProfileField,
  ProfileFieldKey,
} from '@/types/profile';

export function nowIso(): string {
  return new Date().toISOString();
}

/** Who may edit a node's profile, given the viewing account. */
export type EditScope = 'owner' | 'guardian' | 'suggest';

/**
 * Resolve the ownership state of the real person behind a node from its status
 * and claim state (a simplified mapping of the brief's hierarchy).
 */
export function ownershipStateFor(node: FamilyNode): NodeOwnershipState {
  if (node.ownerAccountId) return 'claimed_by_owner';
  const deceased = node.isLiving === false || node.status === 'memory_light' || node.status === 'memorial_pending';
  if (deceased) return node.status === 'memorial_pending' ? 'memorial_guardian_managed' : 'deceased_unclaimed';
  if (node.status === 'managed') return 'managed_by_guardian';
  if (node.status === 'disputed') return 'disputed_ownership';
  return 'unclaimed';
}

/**
 * Determine how the viewer may change a node.
 *
 * - `owner`   — the viewer's own claimed node: edit directly.
 * - `guardian`— an unclaimed/managed/memorial node the viewer stewards: edit directly.
 * - `suggest` — a node claimed by someone else: suggest changes only.
 *
 * In the current single-creator demo the signed-in user is the tree creator, so
 * they act as Guardian for every unclaimed node. `isTreeGuardian` lets callers
 * override this when richer membership data is available.
 */
export function editScopeFor(
  node: FamilyNode,
  viewerAccountId: string | undefined,
  isTreeGuardian = true,
): EditScope {
  if (viewerAccountId && node.ownerAccountId === viewerAccountId) return 'owner';
  if (node.ownerAccountId && node.ownerAccountId !== viewerAccountId) return 'suggest';
  // Unclaimed / managed / memorial nodes -> guardians edit directly.
  return isTreeGuardian ? 'guardian' : 'suggest';
}

export function sourceTypeForScope(scope: EditScope): FieldSourceType {
  switch (scope) {
    case 'owner':
      return 'node_owner';
    case 'guardian':
      return 'guardian';
    default:
      return 'family_member';
  }
}

/** Sensitive fields default to private regardless of the node's default. */
const PRIVATE_BY_DEFAULT: ProfileFieldKey[] = ['genderSex', 'dateOfBirth', 'dateOfDeath'];

export function defaultVisibilityForField(
  key: ProfileFieldKey,
  nodeDefault: VisibilityLevel,
): VisibilityLevel {
  if (PRIVATE_BY_DEFAULT.includes(key)) return 'private';
  return nodeDefault;
}

/** Build a fresh ProfileField with provenance metadata. */
export function makeField<T>(
  value: T,
  opts: {
    visibility: VisibilityLevel;
    scope: EditScope;
    accountId: string;
    confirmed?: boolean;
  },
): ProfileField<T> {
  const status = opts.confirmed ?? opts.scope !== 'suggest' ? 'confirmed' : 'suggested';
  return {
    value,
    visibility: opts.visibility,
    status,
    source: { sourceType: sourceTypeForScope(opts.scope), sourceAccountId: opts.accountId },
    lastEditedByAccountId: opts.accountId,
    lastEditedAt: nowIso(),
  };
}

// ---------------------------------------------------------------------------
// Value formatting
// ---------------------------------------------------------------------------

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatDateValue(d?: DateValue): string {
  if (!d) return '';
  if (d.displayText) return d.displayText;
  if (d.value) {
    const [y, m, day] = d.value.split('-');
    const month = m ? MONTHS[Number(m) - 1] : undefined;
    if (month && day) return `${month} ${Number(day)}, ${y}`;
    if (month) return `${month} ${y}`;
    return y ?? d.value;
  }
  if (d.monthYearOnly) {
    const [y, m] = d.monthYearOnly.split('-');
    return `${MONTHS[Number(m) - 1] ?? ''} ${y}`.trim();
  }
  if (d.yearOnly) return String(d.yearOnly);
  if (d.certainty === 'unknown') return 'Unknown';
  return '';
}

export function dateCertaintyNote(d?: DateValue): string | undefined {
  if (!d) return undefined;
  if (d.certainty === 'approximate') return 'Approximate';
  if (d.certainty === 'disputed') return 'Disputed';
  if (d.certainty === 'unknown') return 'Unknown';
  return undefined;
}

export function formatPlace(p?: PlaceReference, canSeeExact = true): string {
  if (!p) return '';
  if (p.displayName && (canSeeExact || !p.address)) return p.displayName;
  const parts = [p.city, p.region, p.country].filter(Boolean);
  if (parts.length) return parts.join(', ');
  return p.displayName ?? '';
}

export function formatGenderSex(g?: GenderSexField): string {
  if (!g) return '';
  const pref = g.displayPreference ?? 'show_gender';
  if (pref === 'hide') return 'Private';
  const parts: string[] = [];
  if ((pref === 'show_gender' || pref === 'show_both') && g.genderIdentity) parts.push(g.genderIdentity);
  if ((pref === 'show_sex' || pref === 'show_both') && g.sexAssignedOrRecorded) parts.push(g.sexAssignedOrRecorded);
  return parts.join(' · ');
}

/**
 * Sync the rich profile back onto the flat node columns that other parts of the
 * app still read (display name, dates, place, photo, living state).
 */
export function profileToFlatColumns(profile: NodeProfile): {
  display_name?: string;
  legal_name?: string | null;
  avatar_url?: string | null;
  birth_date?: string | null;
  death_date?: string | null;
  city?: string | null;
  country?: string | null;
  is_living?: boolean;
} {
  const out: ReturnType<typeof profileToFlatColumns> = {};
  const name = profile.fullName?.value?.trim();
  if (name) out.display_name = name;
  if (profile.profilePhoto?.value) out.avatar_url = profile.profilePhoto.value;
  const dob = profile.dateOfBirth?.value;
  if (dob?.value) out.birth_date = dob.value;
  const dod = profile.dateOfDeath?.value;
  if (dod?.value) {
    out.death_date = dod.value;
    out.is_living = false;
  }
  const pob = profile.placeOfBirth?.value;
  if (pob) {
    if (pob.city) out.city = pob.city;
    if (pob.country) out.country = pob.country;
  }
  return out;
}
