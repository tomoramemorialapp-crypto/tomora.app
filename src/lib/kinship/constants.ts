import type { LineStyle, RelationshipEdgeType } from './types';

/** Generation deltas applied while traversing edges away from the anchor. */
export const GENERATION_DELTA = {
  PARENT_CHILD_UP: 1,
  PARENT_CHILD_DOWN: -1,
  SAME: 0,
  PET_COMPANION: -0.5,
} as const;

/** Default visual line style per edge type (status can override, see edgeRouter). */
export const LINE_STYLE_BY_EDGE_TYPE: Record<RelationshipEdgeType, LineStyle> = {
  parent_child: 'solid',
  partnership: 'dashed',
  sibling: 'dotted',
  pet_owner: 'wavy',
  guardian_managed: 'muted',
  friend: 'dotted',
  chosen_family: 'dotted',
  placeholder_bridge: 'muted',
};

export const LAYER_Y_SPACING = 220;
export const NODE_X_SPACING = 180;
export const CLUSTER_X_SPACING = 280;
export const NODE_RADIUS = 36;
export const MIN_NODE_GAP = 48;

/**
 * Traversal priority for path/generation resolution. Lower = preferred.
 * Confirmed lineage wins over inferred/placeholder bridges.
 */
export const STATUS_PRIORITY: Record<string, number> = {
  confirmed: 0,
  pending: 3,
  inferred: 4,
  disputed: 6,
  rejected: 99,
};

export const EDGE_TYPE_PRIORITY: Record<RelationshipEdgeType, number> = {
  parent_child: 0,
  partnership: 1,
  sibling: 2,
  guardian_managed: 2,
  pet_owner: 3,
  friend: 4,
  chosen_family: 4,
  placeholder_bridge: 5,
};
