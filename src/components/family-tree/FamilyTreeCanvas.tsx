import { View } from 'react-native';
import { colors, spacing } from '@/constants/theme';
import type { FamilyNode, Relationship } from '@/types/models';
import { relationshipLabel } from '@/lib/relationshipUtils';
import { FamilyNodeCircle } from './FamilyNodeCircle';
import { AddRelativeCard } from './AddRelativeCard';

/**
 * Simple, calm tree layout: the viewer (self) sits at the top as the first
 * light; connected nodes branch beneath, each joined by a thin gold line and a
 * relationship label. Not a full graph engine — intentionally spacious and
 * readable for the MVP.
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

  const labelFor = (nodeId: string): string | undefined => {
    const rel = relationships.find(
      (r) =>
        (r.fromNodeId === selfNode.id && r.toNodeId === nodeId) ||
        (r.toNodeId === selfNode.id && r.fromNodeId === nodeId),
    );
    return rel ? relationshipLabel(rel.relationshipType) : undefined;
  };

  return (
    <View style={{ alignItems: 'center', gap: spacing.sm }}>
      <FamilyNodeCircle node={selfNode} onPress={onSelectNode ? () => onSelectNode(selfNode.id) : undefined} />

      {/* branch lines spreading from self */}
      {others.length > 0 ? (
        <View style={{ width: 2, height: 28, backgroundColor: colors.guardianGold, opacity: 0.7 }} />
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: spacing.lg,
          rowGap: spacing.xl,
        }}
      >
        {others.map((node) => (
          <View key={node.id} style={{ alignItems: 'center' }}>
            <FamilyNodeCircle
              node={node}
              onPress={onSelectNode ? () => onSelectNode(node.id) : undefined}
            />
          </View>
        ))}
        {onAddRelative ? (
          <View style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 0 }}>
            <AddRelativeCard onPress={onAddRelative} />
          </View>
        ) : null}
      </View>
    </View>
  );
}
