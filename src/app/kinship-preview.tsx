import { View } from 'react-native';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Display } from '@/components/ui/Typography';
import { KinshipTreeCanvas } from '@/components/family-tree/KinshipTreeCanvas';
import { spacing } from '@/constants/theme';
import type { FamilyNode, Relationship, RelationshipType } from '@/types/models';

const now = new Date().toISOString();

function node(id: string, name: string, extra: Partial<FamilyNode> = {}): FamilyNode {
  return {
    id,
    familyTreeId: 'preview',
    displayName: name,
    status: 'placeholder',
    defaultVisibility: 'family_tree',
    profile: {},
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...extra,
  };
}

function rel(id: string, to: string, type: RelationshipType): Relationship {
  return {
    id,
    familyTreeId: 'preview',
    fromNodeId: 'self',
    toNodeId: to,
    relationshipType: type,
    status: 'approved',
    visibility: 'family_tree',
    createdByAccountId: 'acct',
    createdAt: now,
    updatedAt: now,
  };
}

const NODES: FamilyNode[] = [
  node('self', 'You', { ownerAccountId: 'acct', status: 'claimed' }),
  node('mom', 'Maria', { status: 'claimed' }),
  node('dad', 'Jose', { status: 'claimed' }),
  node('gm', 'Rosa', { status: 'memory_light', isLiving: false }),
  node('sis', 'Lia', { status: 'invited' }),
  node('partner', 'Aya', { status: 'claimed' }),
  node('kid', 'Theo', { status: 'managed' }),
  node('cousin', 'Marco'),
  node('niece', 'Ana'),
  node('pet', 'Mochi', { status: 'managed' }),
];

const RELS: Relationship[] = [
  rel('r1', 'mom', 'parent'),
  rel('r2', 'dad', 'parent'),
  rel('r3', 'gm', 'grandparent'),
  rel('r4', 'sis', 'sibling'),
  rel('r5', 'partner', 'partner'),
  rel('r6', 'kid', 'child'),
  rel('r7', 'cousin', 'cousin'),
  rel('r8', 'niece', 'niece_nephew'),
  rel('r9', 'pet', 'pet'),
];

export default function KinshipPreview() {
  return (
    <ScreenContainer maxWidth={900}>
      <View style={{ gap: spacing.md }}>
        <Display style={{ fontSize: 28 }}>Kinship Engine preview</Display>
        <KinshipTreeCanvas nodes={NODES} relationships={RELS} anchorNodeId="self" height={560} mode="full" />
      </View>
    </ScreenContainer>
  );
}
