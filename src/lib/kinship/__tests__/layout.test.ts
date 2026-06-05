import { describe, expect, it } from 'vitest';
import { resolveKinshipGraph } from '../index';
import { MIN_NODE_GAP } from '../constants';
import { ANCHOR_ID, buildGraph } from './_fixtures';

const FULL_FAMILY: Parameters<typeof buildGraph>[0] = [
  { id: 'mom', name: 'Mom', rel: 'mother' },
  { id: 'dad', name: 'Dad', rel: 'father' },
  { id: 'gm', name: 'Rosa', rel: 'grandparent', side: 'mother_side' },
  { id: 'sis', name: 'Sister', rel: 'sibling' },
  { id: 'partner', name: 'Aya', rel: 'partner' },
  { id: 'kid', name: 'Kiddo', rel: 'child' },
  { id: 'co', name: 'Marco', rel: 'cousin', side: 'mother_side' },
  { id: 'ni', name: 'Ana', rel: 'niece_nephew' },
  { id: 'pet', name: 'Mochi', rel: 'pet' },
];

describe('layout', () => {
  it('is deterministic for the same input', () => {
    const { nodes, edges } = buildGraph(FULL_FAMILY);
    const a = resolveKinshipGraph({ anchorNodeId: ANCHOR_ID, nodes, edges, options: { mode: 'full' } });
    const b = resolveKinshipGraph({ anchorNodeId: ANCHOR_ID, nodes, edges, options: { mode: 'full' } });
    const layoutOf = (g: typeof a) =>
      g.nodes
        .map((n) => `${n.id}:${n.layout.x},${n.layout.y}`)
        .sort()
        .join('|');
    expect(layoutOf(a)).toBe(layoutOf(b));
  });

  it('pins the anchor to the centre (x = 0)', () => {
    const { nodes, edges } = buildGraph(FULL_FAMILY);
    const g = resolveKinshipGraph({ anchorNodeId: ANCHOR_ID, nodes, edges, options: { mode: 'full' } });
    const anchor = g.nodes.find((n) => n.id === ANCHOR_ID)!;
    expect(anchor.layout.x).toBe(0);
  });

  it('never overlaps nodes within the same layer', () => {
    const { nodes, edges } = buildGraph(FULL_FAMILY);
    const g = resolveKinshipGraph({ anchorNodeId: ANCHOR_ID, nodes, edges, options: { mode: 'full' } });
    const byLayer = new Map<number, number[]>();
    for (const n of g.nodes) {
      const xs = byLayer.get(n.layout.layer) ?? [];
      xs.push(n.layout.x);
      byLayer.set(n.layout.layer, xs);
    }
    for (const xs of byLayer.values()) {
      const sorted = [...xs].sort((p, q) => p - q);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(MIN_NODE_GAP);
      }
    }
  });

  it('places ancestors above (smaller y) and descendants below (larger y)', () => {
    const { nodes, edges } = buildGraph(FULL_FAMILY);
    const g = resolveKinshipGraph({ anchorNodeId: ANCHOR_ID, nodes, edges, options: { mode: 'full' } });
    const y = (id: string) => g.nodes.find((n) => n.id === id)!.layout.y;
    expect(y('mom')).toBeLessThan(y(ANCHOR_ID)); // parent above
    expect(y('gm')).toBeLessThan(y('mom')); // grandparent above parent
    expect(y('kid')).toBeGreaterThan(y(ANCHOR_ID)); // child below
  });

  it('renders pet bonds with a wavy line', () => {
    const { nodes, edges } = buildGraph(FULL_FAMILY);
    const g = resolveKinshipGraph({ anchorNodeId: ANCHOR_ID, nodes, edges, options: { mode: 'full' } });
    const petEdge = g.edges.find((e) => e.type === 'pet_owner');
    expect(petEdge?.lineStyle).toBe('wavy');
  });

  it('draws parent-child as solid and partnership as dashed', () => {
    const { nodes, edges } = buildGraph(FULL_FAMILY);
    const g = resolveKinshipGraph({ anchorNodeId: ANCHOR_ID, nodes, edges, options: { mode: 'full' } });
    const parentEdge = g.edges.find((e) => e.type === 'parent_child' && e.status === 'confirmed');
    const partnerEdge = g.edges.find((e) => e.type === 'partnership');
    expect(parentEdge?.lineStyle).toBe('solid');
    expect(partnerEdge?.lineStyle).toBe('dashed');
  });
});
