import { describe, expect, it } from 'vitest';
import { resolveKinshipGraph } from '../index';
import { getRelationshipExplanation } from '../pathExplainer';
import type { KinshipNode, RelationshipEdge } from '../types';
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

/** Simulate adapter roleLabel metadata frozen to the home user's perspective. */
function withHomeRoleLabels(nodes: KinshipNode[], edges: RelationshipEdge[]): KinshipNode[] {
  const home = resolveKinshipGraph({ anchorNodeId: ANCHOR_ID, nodes, edges, options: { mode: 'full' } });
  return nodes.map((n) => {
    const label = home.nodes.find((h) => h.id === n.id)?.relationshipLabelFromAnchor;
    if (!label || label === 'You') return n;
    return { ...n, metadata: { ...n.metadata, roleLabel: label } };
  });
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

  it('relabels relatives from a non-home anchor using the kinship path, not stored roleLabel', () => {
    const nodes: KinshipNode[] = [
      {
        id: 'gm',
        familyTreeId: 't',
        displayName: 'Grandma',
        nodeType: 'person',
        status: 'claimed',
        visibility: 'family_tree',
        branchType: 'father_side',
      },
      {
        id: 'gp',
        familyTreeId: 't',
        displayName: 'Grandpa',
        nodeType: 'person',
        status: 'claimed',
        visibility: 'family_tree',
      },
      {
        id: 'dad',
        familyTreeId: 't',
        displayName: 'Dad',
        nodeType: 'person',
        status: 'claimed',
        visibility: 'family_tree',
      },
      {
        id: 'mom',
        familyTreeId: 't',
        displayName: 'Mom',
        nodeType: 'person',
        status: 'claimed',
        visibility: 'family_tree',
      },
      {
        id: ANCHOR_ID,
        familyTreeId: 't',
        displayName: 'You',
        nodeType: 'person',
        status: 'claimed',
        visibility: 'family_tree',
      },
    ];
    const edges: RelationshipEdge[] = [
      {
        id: 'e-gp',
        familyTreeId: 't',
        fromNodeId: 'gm',
        toNodeId: 'gp',
        type: 'partnership',
        status: 'confirmed',
        visibility: 'family_tree',
        fromRole: 'partner',
        toRole: 'partner',
      },
      {
        id: 'e-dad',
        familyTreeId: 't',
        fromNodeId: 'gm',
        toNodeId: 'dad',
        type: 'parent_child',
        status: 'confirmed',
        visibility: 'family_tree',
        fromRole: 'parent',
        toRole: 'child',
      },
      {
        id: 'e-mom',
        familyTreeId: 't',
        fromNodeId: 'dad',
        toNodeId: 'mom',
        type: 'partnership',
        status: 'confirmed',
        visibility: 'family_tree',
        fromRole: 'partner',
        toRole: 'partner',
      },
      {
        id: 'e-self',
        familyTreeId: 't',
        fromNodeId: 'dad',
        toNodeId: ANCHOR_ID,
        type: 'parent_child',
        status: 'confirmed',
        visibility: 'family_tree',
        fromRole: 'father',
        toRole: 'child',
      },
    ];

    const labeledNodes = withHomeRoleLabels(nodes, edges);
    const fromGrandma = resolveKinshipGraph({
      anchorNodeId: 'gm',
      nodes: labeledNodes,
      edges,
      options: { mode: 'full', layoutAnchorNodeId: ANCHOR_ID, homeAnchorNodeId: ANCHOR_ID },
    });

    expect(fromGrandma.nodes.find((n) => n.id === 'gp')?.relationshipLabelFromAnchor).toBe('Spouse');
    expect(fromGrandma.nodes.find((n) => n.id === 'dad')?.relationshipLabelFromAnchor).toBe('Son');
    expect(fromGrandma.nodes.find((n) => n.id === 'mom')?.relationshipLabelFromAnchor).toBe('Daughter-in-law');
    expect(fromGrandma.nodes.find((n) => n.id === ANCHOR_ID)?.relationshipLabelFromAnchor).toBe('Grandchild');
  });
});
