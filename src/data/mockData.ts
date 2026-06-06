import type {
  Account,
  FamilyTree,
  FamilyNode,
  Relationship,
  Memory,
} from '@/types/models';

/**
 * Seed demo data from the brief. Used to pre-populate the app for demos and as
 * the starting state before a user completes onboarding.
 */

const now = '2026-01-01T00:00:00.000Z';

export const demoAccount: Account = {
  id: 'account_el',
  displayName: 'EL',
  avatarUrl: undefined,
  socialLinks: {},
  language: 'en',
  themePreference: 'system',
  status: 'active',
  publicProfile: { enabled: false, bio: '', showSocial: true, showMemories: true },
  usernameChanges: [],
  createdAt: now,
  updatedAt: now,
};

export const demoFamilyTree: FamilyTree = {
  id: 'tree_001',
  name: 'My Family Tree',
  createdByAccountId: 'account_el',
  defaultVisibility: 'family_tree',
  publicSharingEnabled: false,
  createdAt: now,
  updatedAt: now,
};

export const demoNodes: FamilyNode[] = [
  {
    id: 'node_el',
    familyTreeId: 'tree_001',
    ownerAccountId: 'account_el',
    displayName: 'EL',
    status: 'claimed',
    isLiving: true,
    defaultVisibility: 'family_tree',
    profile: {},
    tags: [],
    alternateNames: [],
    memorialPrivacy: 'family',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'node_inan',
    familyTreeId: 'tree_001',
    displayName: 'Inan',
    status: 'managed',
    isLiving: false,
    defaultVisibility: 'family_tree',
    profile: {},
    tags: [],
    alternateNames: [],
    memorialPrivacy: 'family',
    createdAt: now,
    updatedAt: now,
  },
];

export const demoRelationships: Relationship[] = [
  {
    id: 'rel_001',
    familyTreeId: 'tree_001',
    fromNodeId: 'node_el',
    toNodeId: 'node_inan',
    relationshipType: 'grandparent',
    status: 'approved',
    visibility: 'family_tree',
    createdByAccountId: 'account_el',
    createdAt: now,
    updatedAt: now,
  },
];

export const demoMemories: Memory[] = [
  {
    id: 'memory_001',
    familyTreeId: 'tree_001',
    nodeId: 'node_inan',
    createdByAccountId: 'account_el',
    type: 'text',
    title: 'Ylang-ylang',
    body: 'She loved ylang-ylang flowers.',
    media: [],
    taggedNodeIds: [],
    visibility: 'family_tree',
    approvalStatus: 'approved',
    createdAt: now,
    updatedAt: now,
  },
];
