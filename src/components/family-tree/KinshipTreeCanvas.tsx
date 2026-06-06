import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector, type GestureType } from 'react-native-gesture-handler';
import Svg, { G } from 'react-native-svg';

import { colors, fonts, radii, shadows, spacing } from '@/constants/theme';
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

const ZOOM = { min: 0.35, max: 2.5, default: 1, focus: 1.4 };

type Transform = { x: number; y: number; k: number };
type Pt = { x: number; y: number };

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Orientation-aware raw position for a node. */
function posFor(node: RenderNode, orientation: FamilyTreeLayoutOrientation): Pt {
  if (orientation === 'horizontal_generational') {
    return { x: node.layout.y, y: node.layout.x };
  }
  return { x: node.layout.x, y: node.layout.y };
}

function edgePath(p1: Pt, p2: Pt, orientation: FamilyTreeLayoutOrientation): string {
  if (orientation === 'horizontal_generational') {
    const mx = (p1.x + p2.x) / 2;
    return `M ${p1.x} ${p1.y} C ${mx} ${p1.y} ${mx} ${p2.y} ${p2.x} ${p2.y}`;
  }
  const my = (p1.y + p2.y) / 2;
  return `M ${p1.x} ${p1.y} C ${p1.x} ${my} ${p2.x} ${my} ${p2.x} ${p2.y}`;
}

/**
 * A node that can be tapped (to inspect/open) or freely dragged around the
 * canvas. Drag offsets are local and ephemeral — never persisted or shared, and
 * reset on every visit. The gesture is memoised on the node id so re-renders
 * during a drag don't cancel it.
 */
const CanvasNode = function CanvasNode({
  node,
  left,
  top,
  selected,
  highlighted,
  canvasPanRef,
  onTap,
  onDragUpdate,
  onDragEnd,
}: {
  node: RenderNode;
  left: number;
  top: number;
  selected: boolean;
  highlighted: boolean;
  canvasPanRef: React.MutableRefObject<GestureType | undefined>;
  onTap: (id: string) => void;
  onDragUpdate: (id: string, dx: number, dy: number) => void;
  onDragEnd: (id: string, dx: number, dy: number) => void;
}) {
  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .blocksExternalGesture(canvasPanRef)
      .minDistance(6)
      .onUpdate((e) => {
        runOnJS(onDragUpdate)(node.id, e.translationX, e.translationY);
      })
      .onEnd((e) => {
        runOnJS(onDragEnd)(node.id, e.translationX, e.translationY);
      });
    const tap = Gesture.Tap()
      .maxDistance(10)
      .onEnd(() => {
        runOnJS(onTap)(node.id);
      });
    return Gesture.Exclusive(pan, tap);
  }, [node.id, canvasPanRef, onTap, onDragUpdate, onDragEnd]);

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ position: 'absolute', left, top }}>
        <FamilyTreeNode node={node} selected={selected} highlighted={highlighted} />
      </View>
    </GestureDetector>
  );
};

/**
 * Engine-powered Family Tree visualizer with a state-driven, draggable,
 * zoomable canvas; name search; relationship-degree / branch / tag filtering;
 * and vertical/horizontal generational orientation. Opens centred on the user.
 */
export function KinshipTreeCanvas({
  nodes,
  relationships,
  anchorNodeId,
  mode = 'full',
  height = 460,
  onSelectNode,
  onOpenMemorial,
  onCompleteUnknown,
  onAddRelative,
}: {
  nodes: FamilyNode[];
  relationships: Relationship[];
  anchorNodeId?: string;
  mode?: LayoutMode;
  height?: number;
  onSelectNode?: (nodeId: string) => void;
  onOpenMemorial?: (nodeId: string) => void;
  onCompleteUnknown?: (node: RenderNode) => void;
  onAddRelative?: () => void;
}) {
  const appNodeIds = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<FamilyTreeLayoutOrientation>('vertical_generational');
  const [filter, setFilter] = useState<FamilyTreeFilterState>(DEFAULT_FILTER);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [container, setContainer] = useState({ w: 0, h: height });

  // Camera transform, driven entirely by React state so the controls are
  // guaranteed to work. Screen = (x, y) + content, scaled about content centre.
  const [tf, setTf] = useState<Transform>({ x: 0, y: 0, k: ZOOM.default });

  // Local, ephemeral per-node drag offsets — never saved, reset on every visit.
  const [dragOffsets, setDragOffsets] = useState<Record<string, Pt>>({});
  const [liveDrag, setLiveDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);

  const canvasPanRef = useRef<GestureType | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      setDragOffsets({});
      setLiveDrag(null);
    }, []),
  );

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
    const posMap = new Map<string, Pt>();
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

  const contentW = view?.width ?? 1;
  const contentH = view?.contentHeight ?? 1;

  // Keep live geometry + transform in refs so stable gesture callbacks can read
  // fresh values without being recreated (which would cancel an active drag).
  const tfRef = useRef(tf);
  tfRef.current = tf;
  const geomRef = useRef({ contentW, contentH, cw: container.w, ch: container.h });
  geomRef.current = { contentW, contentH, cw: container.w, ch: container.h };
  const panStartRef = useRef<Pt>({ x: 0, y: 0 });
  const pinchStartRef = useRef<Transform>({ x: 0, y: 0, k: 1 });

  // --- camera helpers (used by controls + effects; read fresh render scope) ---
  const applyView = useCallback((x: number, y: number, k: number) => {
    setTf({ x, y, k: clamp(k, ZOOM.min, ZOOM.max) });
  }, []);

  const fitView = useCallback(() => {
    const { contentW: cW, contentH: cH, cw, ch } = geomRef.current;
    if (cw === 0) return;
    const k = clamp(Math.min(cw / cW, ch / cH) * 0.86, ZOOM.min, ZOOM.max);
    applyView(cw / 2 - cW / 2, ch / 2 - cH / 2, k);
  }, [applyView]);

  // Centre a content point (in offset/render space) in the viewport at zoom k.
  const centerOnPoint = useCallback(
    (px: number, py: number, k: number) => {
      const { contentW: cW, contentH: cH, cw, ch } = geomRef.current;
      if (cw === 0) return;
      const cx = cW / 2;
      const cy = cH / 2;
      applyView(cw / 2 - (cx + (px - cx) * k), ch / 2 - (cy + (py - cy) * k), k);
    },
    [applyView],
  );

  const centerOnNode = useCallback(
    (id: string, k?: number) => {
      if (!view) return;
      const base = view.posMap.get(id);
      if (!base) return;
      const off = dragOffsets[id];
      const px = base.x + (off?.x ?? 0) + view.offsetX;
      const py = base.y + (off?.y ?? 0) + view.offsetY;
      centerOnPoint(px, py, k ?? tfRef.current.k);
    },
    [view, dragOffsets, centerOnPoint],
  );

  const zoomBy = useCallback(
    (factor: number) => {
      const { contentW: cW, contentH: cH, cw, ch } = geomRef.current;
      if (cw === 0) return;
      const t = tfRef.current;
      const cx = cW / 2;
      const cy = cH / 2;
      const k1 = clamp(t.k * factor, ZOOM.min, ZOOM.max);
      const vX = cw / 2;
      const vY = ch / 2;
      const pcx = cx + (vX - t.x - cx) / t.k;
      const pcy = cy + (vY - t.y - cy) / t.k;
      applyView(vX - (cx + (pcx - cx) * k1), vY - (cy + (pcy - cy) * k1), k1);
    },
    [applyView],
  );

  // Centre on the user (anchor) on first paint; refit when content/orientation
  // changes (filters, layout flip, resize).
  const viewKey = `${Math.round(contentW)}x${Math.round(contentH)}:${orientation}:${Math.round(container.w)}`;
  const lastKey = useRef('');
  const inited = useRef(false);
  useEffect(() => {
    if (!view || container.w === 0) return;
    if (lastKey.current === viewKey) return;
    lastKey.current = viewKey;
    if (!inited.current && graph) {
      inited.current = true;
      centerOnNode(graph.anchorNodeId, ZOOM.default);
    } else {
      fitView();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewKey, view, container.w]);

  // --- stable gesture callbacks (read refs, never recreated) ---
  const panStart = useCallback(() => {
    panStartRef.current = { x: tfRef.current.x, y: tfRef.current.y };
  }, []);
  const panMove = useCallback((dx: number, dy: number) => {
    setTf((t) => ({ ...t, x: panStartRef.current.x + dx, y: panStartRef.current.y + dy }));
  }, []);
  const pinchStart = useCallback(() => {
    pinchStartRef.current = { ...tfRef.current };
  }, []);
  const pinchMove = useCallback((scale: number) => {
    const { contentW: cW, contentH: cH, cw, ch } = geomRef.current;
    if (cw === 0) return;
    const s = pinchStartRef.current;
    const k1 = clamp(s.k * scale, ZOOM.min, ZOOM.max);
    const cx = cW / 2;
    const cy = cH / 2;
    const vX = cw / 2;
    const vY = ch / 2;
    const pcx = cx + (vX - s.x - cx) / s.k;
    const pcy = cy + (vY - s.y - cy) / s.k;
    setTf({ x: vX - (cx + (pcx - cx) * k1), y: vY - (cy + (pcy - cy) * k1), k: k1 });
  }, []);

  const onTapNode = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);
  const onDragUpdateNode = useCallback((id: string, dx: number, dy: number) => {
    const k = tfRef.current.k || 1;
    setLiveDrag({ id, dx: dx / k, dy: dy / k });
  }, []);
  const onDragEndNode = useCallback((id: string, dx: number, dy: number) => {
    const k = tfRef.current.k || 1;
    setDragOffsets((prev) => {
      const cur = prev[id] ?? { x: 0, y: 0 };
      return { ...prev, [id]: { x: cur.x + dx / k, y: cur.y + dy / k } };
    });
    setLiveDrag(null);
  }, []);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .withRef(canvasPanRef)
        .onStart(() => runOnJS(panStart)())
        .onUpdate((e) => runOnJS(panMove)(e.translationX, e.translationY)),
    [panStart, panMove],
  );
  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => runOnJS(pinchStart)())
        .onUpdate((e) => runOnJS(pinchMove)(e.scale)),
    [pinchStart, pinchMove],
  );
  const composed = useMemo(() => Gesture.Simultaneous(panGesture, pinchGesture), [panGesture, pinchGesture]);

  const offsetFor = useCallback(
    (id: string): Pt => {
      const committed = dragOffsets[id];
      const live = liveDrag && liveDrag.id === id ? { x: liveDrag.dx, y: liveDrag.dy } : null;
      return {
        x: (committed?.x ?? 0) + (live?.x ?? 0),
        y: (committed?.y ?? 0) + (live?.y ?? 0),
      };
    },
    [dragOffsets, liveDrag],
  );

  // Edges re-routed to follow committed + live drag offsets.
  const draggedEdges = useMemo<RenderEdge[]>(() => {
    if (!graph || !view) return [];
    const pos = (id: string): Pt => {
      const base = view.posMap.get(id)!;
      const off = offsetFor(id);
      return { x: base.x + off.x, y: base.y + off.y };
    };
    return view.edges.map((e) => ({ ...e, path: edgePath(pos(e.fromNodeId), pos(e.toNodeId), orientation) }));
  }, [graph, view, offsetFor, orientation]);

  const searchResults = useMemo(() => {
    if (!view) return [];
    const q = searchQuery.trim().toLowerCase();
    return view.visibleNodes
      // Exclude only synthetic bridge nodes — unclaimed people keep a
      // 'placeholder' status but are still real, searchable nodes.
      .filter((n) => n.nodeType !== 'placeholder')
      .filter((n) => (q ? n.displayName.toLowerCase().includes(q) : true))
      .slice(0, 8);
  }, [view, searchQuery]);

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

  const onPickSearchResult = (id: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    setSelectedId(id);
    centerOnNode(id, ZOOM.focus);
  };

  return (
    <View style={{ height, borderRadius: radii.lg, overflow: 'hidden', backgroundColor: colors.paper }} onLayout={onLayout}>
      <GestureDetector gesture={composed}>
        <View style={{ flex: 1, overflow: 'hidden' }}>
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: contentW,
              height: contentH,
              transform: [{ translateX: tf.x }, { translateY: tf.y }, { scale: tf.k }],
            }}
          >
            <Svg width={contentW} height={contentH} style={{ position: 'absolute', left: 0, top: 0 }}>
              <G transform={`translate(${view.offsetX}, ${view.offsetY})`}>
                {draggedEdges.map((edge) => (
                  <FamilyTreeEdge key={edge.id} edge={edge} highlighted={highlightedEdges.has(edge.id)} />
                ))}
              </G>
            </Svg>

            {view.visibleNodes.map((node) => {
              const p = view.posMap.get(node.id)!;
              const off = offsetFor(node.id);
              return (
                <CanvasNode
                  key={node.id}
                  node={node}
                  left={p.x + off.x + view.offsetX - NODE_HALF_W}
                  top={p.y + off.y + view.offsetY - NODE_HALF_H}
                  selected={node.id === selectedId}
                  highlighted={
                    highlightedEdges.size > 0 && node.kinshipPathFromAnchor.includes(selectedId ?? '')
                  }
                  canvasPanRef={canvasPanRef}
                  onTap={onTapNode}
                  onDragUpdate={onDragUpdateNode}
                  onDragEnd={onDragEndNode}
                />
              );
            })}
          </View>
        </View>
      </GestureDetector>

      <CanvasControls
        orientation={orientation}
        filterActive={isFilterActive(filter)}
        onZoomIn={() => zoomBy(1.25)}
        onZoomOut={() => zoomBy(1 / 1.25)}
        onFit={fitView}
        onSearch={() => setSearchOpen((v) => !v)}
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

      {searchOpen ? (
        <View
          style={[
            {
              position: 'absolute',
              left: spacing.sm,
              right: 64,
              bottom: spacing.sm,
              backgroundColor: colors.paper,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.softGold,
              padding: spacing.sm,
              gap: spacing.xs,
            },
            shadows.card,
          ]}
        >
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search a name…"
            placeholderTextColor={colors.ashTaupe}
            autoFocus
            style={{
              fontFamily: fonts.body,
              fontSize: 16,
              color: colors.ink,
              backgroundColor: colors.mistBeige,
              borderRadius: radii.md,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.sm,
            }}
          />
          {searchResults.length === 0 ? (
            <Caption style={{ paddingHorizontal: spacing.xs, paddingVertical: spacing.xs }}>No matches.</Caption>
          ) : (
            searchResults.map((n) => (
              <Pressable
                key={n.id}
                onPress={() => onPickSearchResult(n.id)}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.sm,
                  borderRadius: radii.md,
                  backgroundColor: pressed ? colors.mistBeige : 'transparent',
                })}
              >
                <Caption style={{ color: colors.ink, fontSize: 15 }}>{n.displayName}</Caption>
                {n.relationshipLabelFromAnchor ? (
                  <Caption style={{ color: colors.deepUmber, fontSize: 12 }}>
                    {n.relationshipLabelFromAnchor}
                  </Caption>
                ) : null}
              </Pressable>
            ))
          )}
        </View>
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
              appNodeIds.has(selected.id) && onSelectNode ? () => onSelectNode(selected.id) : undefined
            }
            onOpenMemorial={
              appNodeIds.has(selected.id) &&
              (selected.nodeType === 'deceased' ||
                selected.status === 'memory_light' ||
                selected.status === 'memorial_pending') &&
              onOpenMemorial
                ? () => onOpenMemorial(selected.id)
                : undefined
            }
            onCompleteUnknown={
              selected.nodeType === 'placeholder' && !appNodeIds.has(selected.id) && onCompleteUnknown
                ? () => onCompleteUnknown(selected)
                : undefined
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
