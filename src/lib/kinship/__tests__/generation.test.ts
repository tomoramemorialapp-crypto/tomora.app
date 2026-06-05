import { describe, expect, it } from 'vitest';
import { resolveKinshipGraph } from '../index';
import { ANCHOR_ID, buildGraph } from './_fixtures';

function gen(intents: Parameters<typeof buildGraph>[0], targetId: string): number {
  const { nodes, edges } = buildGraph(intents);
  const graph = resolveKinshipGraph({ anchorNodeId: ANCHOR_ID, nodes, edges, options: { mode: 'full' } });
  const node = graph.nodes.find((n) => n.id === targetId);
  if (!node) throw new Error(`node ${targetId} not rendered`);
  return node.generationOffset;
}

describe('generation offsets', () => {
  it('parent is +1', () => {
    expect(gen([{ id: 'p', name: 'Parent', rel: 'parent' }], 'p')).toBe(1);
  });

  it('grandparent is +2', () => {
    expect(gen([{ id: 'g', name: 'Grandparent', rel: 'grandparent' }], 'g')).toBe(2);
  });

  it('child is -1', () => {
    expect(gen([{ id: 'c', name: 'Child', rel: 'child' }], 'c')).toBe(-1);
  });

  it('grandchild is -2', () => {
    expect(gen([{ id: 'gc', name: 'Grandchild', rel: 'grandchild' }], 'gc')).toBe(-2);
  });

  it('sibling is 0', () => {
    expect(gen([{ id: 's', name: 'Sibling', rel: 'sibling' }], 's')).toBe(0);
  });

  it('partner is 0', () => {
    expect(gen([{ id: 'pa', name: 'Partner', rel: 'partner' }], 'pa')).toBe(0);
  });

  it('aunt/uncle is +1', () => {
    expect(gen([{ id: 'a', name: 'Aunt', rel: 'aunt_uncle' }], 'a')).toBe(1);
  });

  it('cousin is 0 (same generation)', () => {
    expect(gen([{ id: 'co', name: 'Cousin', rel: 'cousin' }], 'co')).toBe(0);
  });

  it('niece/nephew is -1', () => {
    expect(gen([{ id: 'ni', name: 'Niece', rel: 'niece_nephew' }], 'ni')).toBe(-1);
  });

  it('pet sits on the companion sub-layer (-0.5)', () => {
    expect(gen([{ id: 'pet', name: 'Mochi', rel: 'pet' }], 'pet')).toBe(-0.5);
  });
});

describe('kinship paths are indirect where appropriate', () => {
  it('cousin path is not a direct anchor→cousin edge', () => {
    const { nodes, edges } = buildGraph([{ id: 'co', name: 'Cousin', rel: 'cousin' }]);
    const graph = resolveKinshipGraph({ anchorNodeId: ANCHOR_ID, nodes, edges, options: { mode: 'full' } });
    const cousin = graph.nodes.find((n) => n.id === 'co')!;
    expect(cousin.kinshipPathFromAnchor.length).toBeGreaterThan(2);
    expect(cousin.kinshipPathFromAnchor[0]).toBe(ANCHOR_ID);
    expect(cousin.kinshipPathFromAnchor[cousin.kinshipPathFromAnchor.length - 1]).toBe('co');
  });

  it('niece path routes through a sibling', () => {
    const { nodes, edges } = buildGraph([{ id: 'ni', name: 'Ana', rel: 'niece_nephew' }]);
    const graph = resolveKinshipGraph({ anchorNodeId: ANCHOR_ID, nodes, edges, options: { mode: 'full' } });
    const niece = graph.nodes.find((n) => n.id === 'ni')!;
    expect(niece.kinshipPathFromAnchor.length).toBe(3); // anchor → sibling → niece
  });
});
