import { describe, expect, it } from 'vitest';

import { resolveTreeNodeTap, TREE_DRAG_THRESHOLD } from '@/lib/kinship/treeInteractions';

describe('treeInteractions', () => {
  it('uses an 8px drag threshold', () => {
    expect(TREE_DRAG_THRESHOLD).toBe(8);
  });

  it('re-anchors when tapping a non-anchor node', () => {
    expect(resolveTreeNodeTap('cousin', 'self')).toEqual({ type: 'reanchor', nodeId: 'cousin' });
  });

  it('toggles details when tapping the current anchor', () => {
    expect(resolveTreeNodeTap('self', 'self')).toEqual({ type: 'toggle_details' });
  });
});
