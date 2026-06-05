import type { ReactNode } from 'react';
import { View } from 'react-native';
import { colors, spacing } from '@/constants/theme';
import type { FamilyNode, Relationship, RelationshipType } from '@/types/models';
import { generationOffset, relationshipLabel } from '@/lib/relationshipUtils';
import { Caption } from '@/components/ui/Typography';
import { FamilyNodeCircle } from './FamilyNodeCircle';
import { AddRelativeCard } from './AddRelativeCard';

/**
 * Calm, generation-aware tree layout. The viewer (self) sits in the middle row.
 * Older generations (parents, grandparents, aunts/uncles) rise above; the same
 * generation (siblings, partner, cousins) sits beside you to the right; younger
 * generations (children, grandchildren, nieces/nephews, pets) settle below.
 */
export function FamilyTreeCanvas({
  nodes,
  relationships,
  selfNodeId,
  onSelectNode,
  onAddRelative,
}: {
  nodes: FamilyNode[];
  relationships: Relationship[];
  selfNodeId?: string;
  onSelectNode?: (nodeId: string) => void;
  onAddRelative?: () => void;
}) {
  const selfNode = nodes.find((n) => n.id === selfNodeId) ?? nodes.find((n) => n.status === 'claimed') ?? nodes[0];
  if (!selfNode) return null;

  const others = nodes.filter((n) => n.id !== selfNode.id);

  const typeFor = (nodeId: string): RelationshipType | undefined => {
    const rel = relationships.find(
      (r) =>
        (r.fromNodeId === selfNode.id && r.toNodeId === nodeId) ||
        (r.toNodeId === selfNode.id && r.fromNodeId === nodeId),
    );
    return rel?.relationshipType;
  };

  const offsetFor = (nodeId: string): -1 | 0 | 1 => {
    const t = typeFor(nodeId);
    return t ? generationOffset(t) : 0;
  };

  const above = others.filter((n) => offsetFor(n.id) === -1);
  const same = others.filter((n) => offsetFor(n.id) === 0);
  const below = others.filter((n) => offsetFor(n.id) === 1);

  const NodeWithLabel = ({ node }: { node: FamilyNode }) => {
    const t = typeFor(node.id);
    return (
      <View style={{ alignItems: 'center', gap: 2 }}>
        <FamilyNodeCircle node={node} onPress={onSelectNode ? () => onSelectNode(node.id) : undefined} />
        {t ? (
          <Caption style={{ color: colors.deepUmber, textTransform: 'capitalize' }}>{relationshipLabel(t)}</Caption>
        ) : null}
      </View>
    );
  };

  const Row = ({ children }: { children: ReactNode }) => (
    <View
      style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.lg, rowGap: spacing.lg }}
    >
      {children}
    </View>
  );

  const VLine = () => <View style={{ width: 2, height: 28, backgroundColor: colors.guardianGold, opacity: 0.7 }} />;
  const HLine = () => <View style={{ width: 28, height: 2, backgroundColor: colors.guardianGold, opacity: 0.7 }} />;

  return (
    <View style={{ alignItems: 'center', gap: spacing.sm }}>
      {above.length > 0 ? (
        <>
          <Row>
            {above.map((node) => (
              <NodeWithLabel key={node.id} node={node} />
            ))}
          </Row>
          <VLine />
        </>
      ) : null}

      {/* self + same generation (to the right) */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}>
        <FamilyNodeCircle node={selfNode} onPress={onSelectNode ? () => onSelectNode(selfNode.id) : undefined} />
        {same.map((node) => (
          <View key={node.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <HLine />
            <NodeWithLabel node={node} />
          </View>
        ))}
      </View>

      {below.length > 0 || onAddRelative ? <VLine /> : null}

      {below.length > 0 || onAddRelative ? (
        <Row>
          {below.map((node) => (
            <NodeWithLabel key={node.id} node={node} />
          ))}
          {onAddRelative ? <AddRelativeCard onPress={onAddRelative} /> : null}
        </Row>
      ) : null}
    </View>
  );
}
