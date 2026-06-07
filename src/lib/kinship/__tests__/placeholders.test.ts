import { describe, expect, it } from 'vitest';
import { buildRelationshipWithPlaceholders } from '../placeholders';
import { ANCHOR_ID, anchorNode, buildGraph } from './_fixtures';

describe('placeholder bridge creation', () => {
  it('adding a cousin creates a placeholder parent and aunt/uncle', () => {
    const res = buildRelationshipWithPlaceholders({
      intent: { anchorNodeId: ANCHOR_ID, targetDisplayName: 'Marco', relationshipToAnchor: 'cousin', targetNodeId: 'co' },
      existingNodes: [anchorNode()],
      existingEdges: [],
      familyTreeId: 't',
    });
    const roles = res.nodesToCreate.map((n) => n.metadata?.roleLabel);
    expect(roles).toContain('Parent');
    expect(roles).toContain('Aunt or Uncle');
    // the aunt/uncle and parent are placeholders
    const aunt = res.nodesToCreate.find((n) => n.metadata?.roleLabel === 'Aunt or Uncle');
    expect(aunt?.status).toBe('placeholder');
  });

  it('adding a niece creates a placeholder sibling when none exists', () => {
    const res = buildRelationshipWithPlaceholders({
      intent: { anchorNodeId: ANCHOR_ID, targetDisplayName: 'Ana', relationshipToAnchor: 'niece_nephew', targetNodeId: 'ni' },
      existingNodes: [anchorNode()],
      existingEdges: [],
      familyTreeId: 't',
    });
    const sibling = res.nodesToCreate.find((n) => n.metadata?.roleLabel === 'Sibling');
    expect(sibling).toBeTruthy();
    expect(sibling?.status).toBe('placeholder');
  });

  it('adding a grandparent creates a placeholder parent when none exists', () => {
    const res = buildRelationshipWithPlaceholders({
      intent: { anchorNodeId: ANCHOR_ID, targetDisplayName: 'Rosa', relationshipToAnchor: 'grandparent', targetNodeId: 'g' },
      existingNodes: [anchorNode()],
      existingEdges: [],
      familyTreeId: 't',
    });
    expect(res.nodesToCreate.some((n) => n.metadata?.roleLabel === 'Parent')).toBe(true);
  });

  it('reuses one parent bridge across grandparent + aunt on the same side', () => {
    const { nodes } = buildGraph([
      { id: 'g', name: 'Rosa', rel: 'grandparent' },
      { id: 'a', name: 'Aunt', rel: 'aunt_uncle' },
    ]);
    const parentBridges = nodes.filter((n) => n.metadata?.roleLabel === 'Parent' && n.status === 'placeholder');
    expect(parentBridges.length).toBe(1);
  });

  it('adding father and mother does not create unknown parent placeholders', () => {
    const { nodes } = buildGraph([
      { id: 'dad', name: 'Jose', rel: 'father' },
      { id: 'mom', name: 'Maria', rel: 'mother' },
    ]);
    const parentBridges = nodes.filter((n) => n.metadata?.roleLabel === 'Parent' && n.status === 'placeholder');
    expect(parentBridges.length).toBe(0);
  });

  it('adding a sibling reuses known parents instead of creating unknown parent', () => {
    const nodes: ReturnType<typeof buildGraph>['nodes'] = [];
    const edges: ReturnType<typeof buildGraph>['edges'] = [];
    const father = buildRelationshipWithPlaceholders({
      intent: { anchorNodeId: ANCHOR_ID, targetDisplayName: 'Jose', relationshipToAnchor: 'father', targetNodeId: 'dad' },
      existingNodes: [anchorNode()],
      existingEdges: [],
      familyTreeId: 't',
    });
    for (const n of father.nodesToCreate) nodes.push(n);
    edges.push(...father.edgesToCreate);

    const mother = buildRelationshipWithPlaceholders({
      intent: { anchorNodeId: ANCHOR_ID, targetDisplayName: 'Maria', relationshipToAnchor: 'mother', targetNodeId: 'mom' },
      existingNodes: [anchorNode(), ...nodes],
      existingEdges: edges,
      familyTreeId: 't',
    });
    for (const n of mother.nodesToCreate) if (!nodes.some((x) => x.id === n.id)) nodes.push(n);
    edges.push(...mother.edgesToCreate);

    const sibling = buildRelationshipWithPlaceholders({
      intent: { anchorNodeId: ANCHOR_ID, targetDisplayName: 'Ana', relationshipToAnchor: 'sibling', targetNodeId: 'sis' },
      existingNodes: [anchorNode(), ...nodes],
      existingEdges: edges,
      familyTreeId: 't',
    });

    const unknownParents = sibling.nodesToCreate.filter(
      (n) => n.metadata?.roleLabel === 'Parent' && n.status === 'placeholder',
    );
    expect(unknownParents.length).toBe(0);
    expect(sibling.edgesToCreate.some((e) => e.type === 'parent_child' && e.fromNodeId === 'dad')).toBe(true);
    expect(sibling.edgesToCreate.some((e) => e.type === 'parent_child' && e.fromNodeId === 'mom')).toBe(true);
  });

  it('skips unknown parent for unbridged siblings', () => {
    const res = buildRelationshipWithPlaceholders({
      intent: {
        anchorNodeId: ANCHOR_ID,
        targetDisplayName: 'Ana',
        relationshipToAnchor: 'sibling',
        targetNodeId: 'sis',
        skipParentBridge: true,
      },
      existingNodes: [anchorNode()],
      existingEdges: [],
      familyTreeId: 't',
    });
    expect(res.nodesToCreate.filter((n) => n.metadata?.roleLabel === 'Parent').length).toBe(0);
    expect(res.edgesToCreate.some((e) => e.type === 'sibling')).toBe(true);
  });

  it('keeps maternal and paternal grandparents on separate parent bridges', () => {
    const { nodes, edges } = buildGraph([
      { id: 'gm', name: 'Maternal GM', rel: 'grandparent', side: 'mother_side' },
      { id: 'gf', name: 'Paternal GF', rel: 'grandparent', side: 'father_side' },
    ]);
    const parentBridges = nodes.filter((n) => n.metadata?.roleLabel === 'Parent' && n.status === 'placeholder');
    expect(parentBridges.length).toBe(2);
    // No edge directly connects the two grandparents.
    const direct = edges.some(
      (e) =>
        (e.fromNodeId === 'gm' && e.toNodeId === 'gf') || (e.fromNodeId === 'gf' && e.toNodeId === 'gm'),
    );
    expect(direct).toBe(false);
  });
});
