/** Minimum pointer movement (px) before a node gesture counts as drag, not tap. */
export const TREE_DRAG_THRESHOLD = 8;

export type TreeTapResult =
  | { type: 'reanchor'; nodeId: string }
  | { type: 'toggle_details' };

/**
 * Resolve a node tap: unfocused nodes become the anchor; tapping the anchor toggles details.
 * Drag gestures must never call this (see KinshipTreeCanvas gesture wiring).
 */
export function resolveTreeNodeTap(tappedId: string, anchorId: string): TreeTapResult {
  if (tappedId !== anchorId) return { type: 'reanchor', nodeId: tappedId };
  return { type: 'toggle_details' };
}
