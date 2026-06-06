/**
 * Family Tree canvas filtering + layout-orientation model.
 *
 * Implements the brief's relationship-degree visibility, branch/status/tag
 * filters, and vertical/horizontal generational orientation. Filtering happens
 * on the resolved render graph so kinship paths stay correct.
 */

import type { BranchType, NodeStatus, RenderNode } from '@/lib/kinship/types';

export type RelationshipVisibilityRange =
  | 'immediate_family'
  | 'first_degree'
  | 'second_degree'
  | 'third_degree'
  | 'extended_family'
  | 'full_visible_tree';

export type LifeStatus = 'living' | 'deceased' | 'unknown';

export type FamilyTreeLayoutOrientation = 'vertical_generational' | 'horizontal_generational';

export interface FamilyTreeFilterState {
  range: RelationshipVisibilityRange;
  branchTypes: BranchType[]; // empty => all
  nodeStatuses: NodeStatus[]; // empty => all
  lifeStatuses: LifeStatus[]; // empty => all
  tags: string[]; // empty => all
  surnames: string[]; // empty => all
  showPlaceholders: boolean;
}

export const DEFAULT_FILTER: FamilyTreeFilterState = {
  range: 'full_visible_tree',
  branchTypes: [],
  nodeStatuses: [],
  lifeStatuses: [],
  tags: [],
  surnames: [],
  showPlaceholders: true,
};

export const RANGE_LABELS: Record<RelationshipVisibilityRange, string> = {
  immediate_family: 'Immediate family',
  first_degree: '1st degree',
  second_degree: '2nd degree',
  third_degree: '3rd degree',
  extended_family: 'Extended family',
  full_visible_tree: 'Full Family Tree',
};

export const RANGE_ORDER: RelationshipVisibilityRange[] = [
  'immediate_family',
  'first_degree',
  'second_degree',
  'third_degree',
  'extended_family',
  'full_visible_tree',
];

export const BRANCH_LABELS: Record<BranchType, string> = {
  self: 'You',
  mother_side: "Mother's side",
  father_side: "Father's side",
  partner_side: "Partner's side",
  chosen_family: 'Chosen family',
  pet_companion: 'Pets',
  unsorted: 'Unsorted',
};

function maxDistanceFor(range: RelationshipVisibilityRange): number {
  switch (range) {
    case 'first_degree':
      return 1;
    case 'immediate_family':
    case 'second_degree':
      return 2;
    case 'third_degree':
      return 3;
    case 'extended_family':
      return 5;
    case 'full_visible_tree':
    default:
      return Infinity;
  }
}

export function lifeStatusOf(node: RenderNode): LifeStatus {
  if (node.nodeType === 'deceased' || node.status === 'memory_light' || node.status === 'memorial_pending') {
    return 'deceased';
  }
  if (node.nodeType === 'placeholder' || node.status === 'placeholder') return 'unknown';
  const isLiving = (node.metadata as { isLiving?: boolean } | undefined)?.isLiving;
  return isLiving === false ? 'deceased' : 'living';
}

export function tagsOf(node: RenderNode): string[] {
  return ((node.metadata as { tags?: string[] } | undefined)?.tags ?? []) as string[];
}

export function surnameOf(node: RenderNode): string | undefined {
  const s = (node.metadata as { surname?: string } | undefined)?.surname?.trim();
  return s || undefined;
}

export function nameSearchHaystackOf(node: RenderNode): string {
  const md = node.metadata as { nameSearch?: string } | undefined;
  if (md?.nameSearch) return md.nameSearch;
  return node.displayName.toLowerCase();
}

/** Whether a resolved node passes the active filter. The anchor always passes. */
export function nodeMatchesFilter(node: RenderNode, filter: FamilyTreeFilterState): boolean {
  if (node.isAnchor) return true;

  const distance = Math.max(0, node.kinshipPathFromAnchor.length - 1);
  if (distance > maxDistanceFor(filter.range)) return false;

  if (!filter.showPlaceholders && (node.nodeType === 'placeholder' || node.status === 'placeholder')) {
    return false;
  }
  if (filter.branchTypes.length && !filter.branchTypes.includes(node.branchType)) return false;
  if (filter.nodeStatuses.length && !filter.nodeStatuses.includes(node.status)) return false;
  if (filter.lifeStatuses.length && !filter.lifeStatuses.includes(lifeStatusOf(node))) return false;
  if (filter.tags.length) {
    const t = tagsOf(node);
    if (!filter.tags.some((tag) => t.includes(tag))) return false;
  }
  if (filter.surnames.length) {
    const s = surnameOf(node);
    if (!s || !filter.surnames.includes(s)) return false;
  }
  return true;
}

export function isFilterActive(filter: FamilyTreeFilterState): boolean {
  return (
    filter.range !== DEFAULT_FILTER.range ||
    filter.branchTypes.length > 0 ||
    filter.nodeStatuses.length > 0 ||
    filter.lifeStatuses.length > 0 ||
    filter.tags.length > 0 ||
    filter.surnames.length > 0 ||
    !filter.showPlaceholders
  );
}
