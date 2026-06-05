import { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { G } from 'react-native-svg';

import { colors, radii, spacing } from '@/constants/theme';
import { Caption } from '@/components/ui/Typography';
import { GoldStar } from '@/components/brand/GoldStar';
import type { FamilyNode, Relationship } from '@/types/models';
import { buildKinshipGraphFromApp } from '@/lib/kinship/adapter';
import { resolveKinshipGraph, getRelationshipExplanation } from '@/lib/kinship';
import type { BranchType, LayoutMode, RenderEdge, RenderNode } from '@/lib/kinship/types';
import { FamilyTreeNode } from './FamilyTreeNode';
import { FamilyTreeEdge } from './FamilyTreeEdge';
import { RelationshipTooltip } from './RelationshipTooltip';
import { CanvasControls } from './CanvasControls';
import { FamilyTreeFilterSheet } from './FamilyTreeFilterSheet';
import {
  DEFAULT_FILTER,
  isFilterActive,
  nodeMatchesFilter,
  tagsOf,
  type FamilyTreeFilterState,
  type FamilyTreeLayoutOrientation,
} from './canvasFilters';

const PAD_X = 90;
const PAD_TOP = 70;
const PAD_BOTTOM = 110;
const NODE_HALF_W = 66;
const NODE_HALF_H = 36;

const ZOOM = { min: 0.35, max: 2.5, default: 1 };

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Orientation-aware raw position for a node. */
function posFor(node: RenderNode, orientation: FamilyTreeLayoutOrientation): { x: number; y: number } {
  if (orientation === 'horizontal_generational') {
    return { x: node.layout.y, y: node.layout.x };
  }
  return { x: node.layout.x, y: node.layout.y };
}

function edgePath(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  orientation: FamilyTreeLayoutOrientation,
): string {
  if (orientation === 'horizontal_generational') {
    const mx = (p1.x + p2.x) / 2;
    return `M ${p1.x} ${p1.y} C ${mx} ${p1.y} ${mx} ${p2.y} ${p2.x} ${p2.y}`;
  }
  const my = (p1.y + p2.y) / 2;
  return `M ${p1.x} ${p1.y} C ${p1.x} ${my} ${p2.x} ${my} ${p2.x} ${p2.y}`;
}

/**
 * Engine-powered Family Tree visualizer with a draggable, zoomable canvas,
 * relationship-degree / branch / tag filtering, and vertical/horizontal
 * generational orientation.
 */
export function KinshipTreeCanvas({
  nodes,
  relationships,
  anchorNodeId,
  mode = 'full',
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
  const [orientation, setOrientation] = useState<FamilyTreeLayoutOrientation>('vertical_generational');
  const [filter, setFilter] = useState<FamilyTreeFilterState>(DEFAULT_FILTER);
  const [filterOpen, setFilterOpen] = useState(false);
  const [container, setContainer] = useState({ w: 0, h: height });

  const anchor = anchorNodeId ?? nodes.find((n) => n.ownerAccountId)?.id ?? nodes[0]?.id;

  const graph = useMemo(() => {
    if (!anchor || nodes.length === 0) return null;
    const data = buildKinshipGraphFromApp({ nodes, relationships, anchorNodeId: anchor });
    return resolveKinshipGraph({ anchorNodeId: anchor, nodes: data.nodes, edges: data.edges, options: { mode } });
  }, [anchor, nodes, relationships, mode]);

  // Apply filters -> visible node ids, positions, bounds, and rerouted edges.
  const view = useMemo(() => {
    if (!graph || graph.nodes.length === 0) return null;
    const visibleNodes = graph.nodes.filter((n) => nodeMatchesFilter(n, filter));
    const visibleIds = new Set(visibleNodes.map((n) => n.id));
    const posMap = new Map<string, { x: number; y: number }>();
    for (const n of visibleNodes) posMap.set(n.id, posFor(n, orientation));

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of posMap.values()) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    const offsetX = -minX + PAD_X;
    const offsetY = -minY + PAD_TOP;
    const width = maxX - minX + PAD_X * 2;
    const contentHeight = maxY - minY + PAD_TOP + PAD_BOTTOM;

    const edges: RenderEdge[] = graph.edges
      .filter((e) => visibleIds.has(e.fromNodeId) && visibleIds.has(e.toNodeId))
      .map((e) => {
        const a = posMap.get(e.fromNodeId)!;
        const b = posMap.get(e.toNodeId)!;
        return { ...e, path: edgePath(a, b, orientation) };
      });

    return { visibleNodes, visibleIds, posMap, offsetX, offsetY, width, contentHeight, edges };
  }, [graph, filter, orientation]);

  const availableBranches = useMemo<BranchType[]>(() => {
    if (!graph) return [];
    const set = new Set<BranchType>();
    for (const n of graph.nodes) if (!n.isAnchor) set.add(n.branchType);
    return [...set];
  }, [graph]);

  const availableTags = useMemo<string[]>(() => {
    if (!graph) return [];
    const set = new Set<string>();
    for (const n of graph.nodes) for (const t of tagsOf(n)) set.add(t);
    return [...set];
  }, [graph]);

  // --- Pan / zoom shared values ---
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(ZOOM.default);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startScale = useSharedValue(ZOOM.default);

  const contentW = view?.width ?? 1;
  const contentH = view?.contentHeight ?? 1;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const setView = (nextTx: number, nextTy: number, nextScale: number, animate = true) => {
    const s = clamp(nextScale, ZOOM.min, ZOOM.max);
    if (animate) {
      tx.value = withTiming(nextTx, { duration: 260 });
      ty.value = withTiming(nextTy, { duration: 260 });
      scale.value = withTiming(s, { duration: 260 });
    } else {
      tx.value = nextTx;
      ty.value = nextTy;
      scale.value = s;
    }
    startX.value = nextTx;
    startY.value = nextTy;
    startScale.value = s;
  };

  const fitView = (animate = true) => {
    if (!view || container.w === 0) return;
    const cx = contentW / 2;
    const cy = contentH / 2;
    const s = clamp(Math.min(container.w / contentW, container.h / contentH) * 0.88, ZOOM.min, ZOOM.max);
    setView(container.w / 2 - cx, container.h / 2 - cy, s, animate);
  };

  const centerOnAnchor = () => {
    if (!view || !graph || container.w === 0) return;
    const p = view.posMap.get(graph.anchorNodeId);
    if (!p) return;
    const cx = contentW / 2;
    const cy = contentH / 2;
    const s = scale.value;
    const px = p.x + view.offsetX;
    const py = p.y + view.offsetY;
    setView(container.w / 2 - (cx + (px - cx) * s), container.h / 2 - (cy + (py - cy) * s), s);
  };

  const zoomBy = (factor: number) => {
    if (container.w === 0) return;
    const cx = contentW / 2;
    const cy = contentH / 2;
    const s0 = scale.value;
    const s1 = clamp(s0 * factor, ZOOM.min, ZOOM.max);
    // Keep the viewport center anchored to the same content point.
    const vX = container.w / 2;
    const vY = container.h / 2;
    const pcx = cx + (vX - cx - tx.value) / s0;
    const pcy = cy + (vY - cy - ty.value) / s0;
    setView(vX - (cx + (pcx - cx) * s1), vY - (cy + (pcy - cy) * s1), s1);
  };

  // Fit whenever the content, orientation, or container size changes.
  const fitKey = `${contentW}x${contentH}:${orientation}:${container.w}x${container.h}`;
  const lastFit = useRef('');
  useEffect(() => {
    if (!view || container.w === 0) return;
    if (lastFit.current === fitKey) return;
    lastFit.current = fitKey;
    fitView(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, view, container.w]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          startX.value = tx.value;
          startY.value = ty.value;
        })
        .onUpdate((e) => {
          tx.value = startX.value + e.translationX;
          ty.value = startY.value + e.translationY;
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          startScale.value = scale.value;
        })
        .onUpdate((e) => {
          scale.value = clamp(startScale.value * e.scale, ZOOM.min, ZOOM.max);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const composed = useMemo(() => Gesture.Simultaneous(panGesture, pinchGesture), [panGesture, pinchGesture]);

  if (!graph || !view) {
    return (
      <View style={{ alignItems: 'center', padding: spacing.xl }}>
        <Caption>Your Family Tree is just beginning.</Caption>
      </View>
    );
  }

  const selected = view.visibleNodes.find((n) => n.id === selectedId) ?? null;

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

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height: h } = e.nativeEvent.layout;
    setContainer((prev) => (prev.w === width && prev.h === h ? prev : { w: width, h }));
  };

  return (
    <View style={{ height, borderRadius: radii.lg, overflow: 'hidden', backgroundColor: colors.paper }} onLayout={onLayout}>
      <GestureDetector gesture={composed}>
        <View style={{ flex: 1, overflow: 'hidden' }}>
          <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: contentW, height: contentH }, animatedStyle]}>
            <Svg width={contentW} height={contentH} style={{ position: 'absolute', left: 0, top: 0 }}>
              <G transform={`translate(${view.offsetX}, ${view.offsetY})`}>
                {view.edges.map((edge) => (
                  <FamilyTreeEdge key={edge.id} edge={edge} highlighted={highlightedEdges.has(edge.id)} />
                ))}
              </G>
            </Svg>

            {view.visibleNodes.map((node) => {
              const p = view.posMap.get(node.id)!;
              return (
                <View
                  key={node.id}
                  style={{
                    position: 'absolute',
                    left: p.x + view.offsetX - NODE_HALF_W,
                    top: p.y + view.offsetY - NODE_HALF_H,
                  }}
                >
                  <FamilyTreeNode
                    node={node}
                    selected={node.id === selectedId}
                    highlighted={highlightedEdges.size > 0 && node.kinshipPathFromAnchor.includes(selectedId ?? '')}
                    onPress={() => setSelectedId((prev) => (prev === node.id ? null : node.id))}
                  />
                </View>
              );
            })}
          </Animated.View>
        </View>
      </GestureDetector>

      <CanvasControls
        orientation={orientation}
        filterActive={isFilterActive(filter)}
        onZoomIn={() => zoomBy(1.25)}
        onZoomOut={() => zoomBy(1 / 1.25)}
        onFit={() => fitView(true)}
        onCenter={centerOnAnchor}
        onToggleOrientation={() =>
          setOrientation((o) =>
            o === 'vertical_generational' ? 'horizontal_generational' : 'vertical_generational',
          )
        }
        onOpenFilters={() => setFilterOpen(true)}
      />

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

      <FamilyTreeFilterSheet
        visible={filterOpen}
        filter={filter}
        onChange={setFilter}
        onClose={() => setFilterOpen(false)}
        availableBranches={availableBranches}
        availableTags={availableTags}
      />
    </View>
  );
}
