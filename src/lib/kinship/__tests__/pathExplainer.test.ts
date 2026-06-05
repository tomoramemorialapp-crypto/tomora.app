import { describe, expect, it } from 'vitest';
import { resolveKinshipGraph } from '../index';
import { getRelationshipExplanation } from '../pathExplainer';
import { ANCHOR_ID, buildGraph } from './_fixtures';

function explain(intents: Parameters<typeof buildGraph>[0], targetId: string): { label: string; sentence: string } {
  const { nodes, edges } = buildGraph(intents);
  const graph = resolveKinshipGraph({ anchorNodeId: ANCHOR_ID, nodes, edges, options: { mode: 'full' } });
  const node = graph.nodes.find((n) => n.id === targetId)!;
  const sentence = getRelationshipExplanation({
    anchorNodeId: ANCHOR_ID,
    targetNodeId: targetId,
    path: node.kinshipPathFromAnchor,
    nodes: graph.nodes,
    edges,
  });
  return { label: node.relationshipLabelFromAnchor, sentence };
}

describe('relationship labels & explanations', () => {
  it('labels a maternal grandparent', () => {
    const { label } = explain([{ id: 'g', name: 'Rosa', rel: 'grandparent', side: 'mother_side' }], 'g');
    expect(label.toLowerCase()).toContain('maternal');
    expect(label.toLowerCase()).toContain('grandparent');
  });

  it('explains a cousin on the mother’s side', () => {
    const { sentence } = explain([{ id: 'co', name: 'Marco', rel: 'cousin', side: 'mother_side' }], 'co');
    expect(sentence.startsWith('Marco is your cousin')).toBe(true);
    expect(sentence.toLowerCase()).toContain('mother');
  });

  it('explains a niece through a sibling', () => {
    const { sentence } = explain([{ id: 'ni', name: 'Ana', rel: 'niece_nephew' }], 'ni');
    expect(sentence.toLowerCase()).toContain('niece or nephew');
    expect(sentence.toLowerCase()).toContain('sibling');
  });

  it('explains a pet as a family companion', () => {
    const { label, sentence } = explain([{ id: 'pet', name: 'Mochi', rel: 'pet' }], 'pet');
    expect(label).toBe('Family pet');
    expect(sentence.toLowerCase()).toContain('family pet');
  });
});
