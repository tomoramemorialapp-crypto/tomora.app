import { describe, expect, it } from 'vitest';

import { companionReply, findNodeByQuery, type CompanionContext } from '@/lib/companion/respond';
import type { FamilyNode, Memory, Relationship } from '@/types/models';

const node = (partial: Partial<FamilyNode> & Pick<FamilyNode, 'id' | 'displayName'>): FamilyNode => ({
  familyTreeId: 'tree-1',
  status: 'claimed',
  defaultVisibility: 'family_tree',
  profile: {},
  tags: [],
  alternateNames: [],
  memorialPrivacy: 'family',
  createdAt: '',
  updatedAt: '',
  ...partial,
});

const rel = (partial: Partial<Relationship> & Pick<Relationship, 'id' | 'fromNodeId' | 'toNodeId' | 'relationshipType'>): Relationship => ({
  familyTreeId: 'tree-1',
  status: 'approved',
  visibility: 'family_tree',
  createdByAccountId: 'acct-1',
  createdAt: '',
  updatedAt: '',
  ...partial,
});

const memory = (partial: Partial<Memory> & Pick<Memory, 'id'>): Memory => ({
  familyTreeId: 'tree-1',
  createdByAccountId: 'acct-1',
  type: 'text',
  media: [],
  taggedNodeIds: [],
  visibility: 'family_tree',
  approvalStatus: 'approved',
  createdAt: '',
  updatedAt: '',
  ...partial,
});

describe('findNodeByQuery', () => {
  const nodes = [node({ id: 'self', displayName: 'Alex', ownerAccountId: 'acct-1' }), node({ id: 'mom', displayName: 'Maria' })];

  it('matches exact names', () => {
    const match = findNodeByQuery(nodes, 'Maria');
    expect(match).not.toBe('ambiguous');
    expect(match && typeof match === 'object' ? match.id : undefined).toBe('mom');
  });

  it('flags ambiguous partial matches', () => {
    const ambiguous = [
      node({ id: 'a', displayName: 'John Smith' }),
      node({ id: 'b', displayName: 'John Doe' }),
    ];
    expect(findNodeByQuery(ambiguous, 'John')).toBe('ambiguous');
  });
});

describe('companionReply', () => {
  const ctx: CompanionContext = {
    viewerNodeId: 'self',
    nodes: [
      node({ id: 'self', displayName: 'Alex', ownerAccountId: 'acct-1' }),
      node({ id: 'mom', displayName: 'Maria' }),
    ],
    relationships: [rel({ id: 'r1', fromNodeId: 'self', toNodeId: 'mom', relationshipType: 'parent' })],
    memories: [
      memory({ id: 'm1', title: 'Summer picnic', body: 'Maria brought her famous pie.', taggedNodeIds: ['mom'] }),
    ],
  };

  it('explains a relationship from the viewer anchor', () => {
    const reply = companionReply('How is Maria related to me?', ctx);
    expect(reply).toMatch(/Maria/);
    expect(reply).toMatch(/parent|mother/i);
  });

  it('finds memories by keyword', () => {
    const reply = companionReply('memories about picnic', ctx);
    expect(reply).toMatch(/Summer picnic/);
  });

  it('lists upcoming occasions when asked', () => {
    const withBirthday = {
      ...ctx,
      nodes: [
        ...ctx.nodes,
        node({
          id: 'kid',
          displayName: 'Sam',
          profile: {
            dateOfBirth: {
              value: { value: '2015-06-15', certainty: 'exact' },
              visibility: 'family_tree',
              status: 'confirmed',
              source: { sourceType: 'node_owner', sourceAccountId: 'acct-1' },
              lastEditedByAccountId: 'acct-1',
              lastEditedAt: '',
            },
          },
        }),
      ],
    };
    const reply = companionReply('What birthdays are coming up?', withBirthday);
    expect(reply).toMatch(/coming up|Sam|birthday/i);
  });
});
