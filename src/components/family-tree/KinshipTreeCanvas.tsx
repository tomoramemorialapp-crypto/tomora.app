import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Svg, { G } from 'react-native-svg';

import { colors, radii, spacing } from '@/constants/theme';
import { Caption } from '@/components/ui/Typography';
import { GoldStar } from '@/components/brand/GoldStar';
import type { FamilyNode, Relationship } from '@/types/models';
import { buildKinshipGraphFromApp } from '@/lib/kinship/adapter';
import { resolveKinshipGraph, getRelationshipExplanation } from '@/lib/kinship';
import type { LayoutMode } from '@/lib/kinship/types';
import { FamilyTreeNode } from './FamilyTreeNode';
import { FamilyTreeEdge } from './FamilyTreeEdge';
import { RelationshipTooltip } from './RelationshipTooltip';

const PAD_X = 80;
const PAD_TOP = 56;
const PAD_BOTTOM = 96;

/**
 * Engine-powered Family Tree visualizer. Converts the app's stored graph into a
 * deterministic, non-overlapping kinship layout (via the Tomora Kinship Engine)
 * and renders SVG edges + node lights with path highlighting and relationship
 * explanations.
 */
export function KinshipTreeCanvas({
  nodes,
  relationships,
  anchorNodeId,
  mode = 'focus',
  height = 460,
  onSelectNode,
  onAddRelative,
}: {
  nodes: FamilyNode[];
  relationships: Relationship[];
  anchorNodeId?: string;
  mode?: LayoutMode;
  height?: number;
  onSelectNode?: (nodeId: string) => void;
  onAddRelative?: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const anchor = anchorNodeId ?? nodes.find((n) => n.ownerAccountId)?.id ?? nodes[0]?.id;

  const graph = useMemo(() => {
    if (!anchor || nodes.length === 0) return null;
    const data = buildKinshipGraphFromApp({ nodes, relationships, anchorNodeId: anchor });
    return resolveKinshipGraph({ anchorNodeId: anchor, nodes: data.nodes, edges: data.edges, options: { mode } });
  }, [anchor, nodes, relationships, mode]);

  const bounds = useMemo(() => {
    if (!graph || graph.nodes.length === 0) return null;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const n of graph.nodes) {
      minX = Math.min(minX, n.layout.x);
      maxX = Math.max(maxX, n.layout.x);
      minY = Math.min(minY, n.layout.y);
      maxY = Math.max(maxY, n.layout.y);
    }
    const offsetX = -minX + PAD_X;
    const offsetY = -minY + PAD_TOP;
    const width = maxX - minX + PAD_X * 2;
    const canvasHeight = maxY - minY + PAD_TOP + PAD_BOTTOM;
    return { offsetX, offsetY, width, height: canvasHeight };
  }, [graph]);

  if (!graph || !bounds) {
    return (
      <View style={{ alignItems: 'center', padding: spacing.xl }}>
        <Caption>Your Family Tree is just beginning.</Caption>
      </View>
    );
  }

  const selected = graph.nodes.find((n) => n.id === selectedId) ?? null;

  // Edges along the selected node's path glow.
  const highlightedEdges = new Set<string>();
  if (selected) {
    const path = selected.kinshipPathFromAnchor;
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i];
      const b = path[i + 1];
      for (const e of graph.edges) {
        if ((e.fromNodeId === a && e.toNodeId === b) || (e.fromNodeId === b && e.toNodeId === a)) {
          highlightedEdges.add(e.id);
        }
      }
    }
  }

  return (
    <View style={{ height, borderRadius: radii.lg, overflow: 'hidden' }}>
      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: '100%' }}>
        <ScrollView showsVerticalScrollIndicator contentContainerStyle={{ minHeight: height }}>
          <View style={{ width: bounds.width, height: bounds.height }}>
            <Svg width={bounds.width} height={bounds.height} style={{ position: 'absolute', left: 0, top: 0 }}>
              <G translateX={bounds.offsetX} translateY={bounds.offsetY}>
                {graph.edges.map((edge) => (
                  <FamilyTreeEdge key={edge.id} edge={edge} highlighted={highlightedEdges.has(edge.id)} />
                ))}
              </G>
            </Svg>

            {graph.nodes.map((node) => (
              <View
                key={node.id}
                style={{
                  position: 'absolute',
                  left: node.layout.x + bounds.offsetX - 66,
                  top: node.layout.y + bounds.offsetY - 36,
                }}
              >
                <FamilyTreeNode
                  node={node}
                  selected={node.id === selectedId}
                  highlighted={highlightedEdges.size > 0 && node.kinshipPathFromAnchor.includes(selectedId ?? '')}
                  onPress={() => setSelectedId((prev) => (prev === node.id ? null : node.id))}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>

      {onAddRelative ? (
        <Pressable
          onPress={onAddRelative}
          accessibilityRole="button"
          accessibilityLabel="Add a family member"
          style={({ pressed }) => ({
            position: 'absolute',
            top: spacing.sm,
            right: spacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: colors.guardianGold,
            borderRadius: radii.pill,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <GoldStar size={14} color={colors.paper} />
          <Caption style={{ color: colors.paper, fontWeight: '700', letterSpacing: 0.4 }}>Add family</Caption>
        </Pressable>
      ) : null}

      {selected ? (
        <View style={{ position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md }}>
          <RelationshipTooltip
            name={selected.displayName}
            label={selected.relationshipLabelFromAnchor}
            explanation={getRelationshipExplanation({
              anchorNodeId: graph.anchorNodeId,
              targetNodeId: selected.id,
              path: selected.kinshipPathFromAnchor,
              nodes: graph.nodes,
              edges: graph.edges,
            })}
            onOpenProfile={
              selected.status !== 'placeholder' && onSelectNode ? () => onSelectNode(selected.id) : undefined
            }
            onClose={() => setSelectedId(null)}
          />
        </View>
      ) : null}
    </View>
  );
}
