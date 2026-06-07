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
  surnameOf,
  nameSearchHaystackOf,
  type FamilyTreeFilterState,
  type FamilyTreeLayoutOrientation,
} from './canvasFilters';
import { resolveTreeNodeTap, TREE_DRAG_THRESHOLD } from '@/lib/kinship/treeInteractions';

const PAD_X = 90;
const PAD_TOP = 70;
const PAD_BOTTOM = 110;
const NODE_HALF_W = 66;
const NODE_HALF_H = 36;

const ZOOM = { min: 0.35, max: 2.5, default: 1 };

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
  highlighted,
  minimalView,
  canvasPanRef,
  onTap,
  onDragUpdate,
  onDragEnd,
}: {
  node: RenderNode;
  left: number;
  top: number;
  highlighted: boolean;
  minimalView: boolean;
  canvasPanRef: React.MutableRefObject<GestureType | undefined>;
  onTap: (id: string) => void;
  onDragUpdate: (id: string, dx: number, dy: number) => void;
  onDragEnd: (id: string, dx: number, dy: number) => void;
}) {
  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .blocksExternalGesture(canvasPanRef)
      .minDistance(TREE_DRAG_THRESHOLD)
      .onUpdate((e) => {
        runOnJS(onDragUpdate)(node.id, e.translationX, e.translationY);
      })
      .onEnd((e) => {
        runOnJS(onDragEnd)(node.id, e.translationX, e.translationY);
      });
    const tap = Gesture.Tap()
      .maxDistance(TREE_DRAG_THRESHOLD)
      .onEnd(() => {
        runOnJS(onTap)(node.id);
      });
    return Gesture.Exclusive(pan, tap);
  }, [node.id, canvasPanRef, onTap, onDragUpdate, onDragEnd]);

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ position: 'absolute', left, top }}>
        <FamilyTreeNode node={node} highlighted={highlighted} showRelationshipLabel={!minimalView} />
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
  homeAnchorNodeId,
  onAnchorChange,
  mode = 'full',
  height = 460,
  onSelectNode,
  onOpenMemorial,
  onCompleteUnknown,
  onAddRelative,
  onAddRelativeFromNode,
  onMinimalViewChange,
}: {
  nodes: FamilyNode[];
  relationships: Relationship[];
  /** Perspective node — relationship labels are computed from here; layout stays on home anchor. */
  anchorNodeId?: string;
  /** Signed-in user's node — used for "View from me" and contextual copy. */
  homeAnchorNodeId?: string;
  onAnchorChange?: (nodeId: string) => void;
  mode?: LayoutMode;
  height?: number;
  onSelectNode?: (nodeId: string) => void;
  onOpenMemorial?: (nodeId: string) => void;
  onCompleteUnknown?: (node: RenderNode) => void;
  onAddRelative?: () => void;
  onAddRelativeFromNode?: (nodeId: string) => void;
  onMinimalViewChange?: (minimal: boolean) => void;
}) {
  const appNodeIds = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [orientation, setOrientation] = useState<FamilyTreeLayoutOrientation>('vertical_generational');
  const [filter, setFilter] = useState<FamilyTreeFilterState>(DEFAULT_FILTER);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [minimalView, setMinimalView] = useState(false);
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

  const homeAnchor = homeAnchorNodeId ?? nodes.find((n) => n.ownerAccountId)?.id ?? nodes[0]?.id;
  const layoutAnchor = homeAnchor;
  const viewAnchor =
    anchorNodeId ?? homeAnchor ?? nodes.find((n) => n.ownerAccountId)?.id ?? nodes[0]?.id;

  const graph = useMemo(() => {
    if (!layoutAnchor || !viewAnchor || nodes.length === 0) return null;
    const data = buildKinshipGraphFromApp({ nodes, relationships, anchorNodeId: layoutAnchor });
    return resolveKinshipGraph({
      anchorNodeId: viewAnchor,
      nodes: data.nodes,
      edges: data.edges,
      options: { mode, homeAnchorNodeId: homeAnchor, layoutAnchorNodeId: layoutAnchor },
    });
  }, [layoutAnchor, viewAnchor, homeAnchor, nodes, relationships, mode]);

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
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [graph]);

  const availableSurnames = useMemo<string[]>(() => {
    if (!graph) return [];
    const set = new Set<string>();
    for (const n of graph.nodes) {
      const s = surnameOf(n);
      if (s) set.add(s);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
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
    if (!inited.current && graph && layoutAnchor) {
      inited.current = true;
      centerOnNode(layoutAnchor, ZOOM.default);
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

  const onTapNode = useCallback(
    (id: string) => {
      const action = resolveTreeNodeTap(id, viewAnchor);
      if (action.type === 'reanchor') {
        setDetailsOpen(false);
        onAnchorChange?.(action.nodeId);
        return;
      }
      setDetailsOpen((open) => !open);
    },
    [viewAnchor, onAnchorChange],
  );
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
      .filter((n) => (q ? nameSearchHaystackOf(n).includes(q) : true))
      .slice(0, 8);
  }, [view, searchQuery]);

  const homePerspectiveExplanation = useMemo(() => {
    if (!homeAnchor || viewAnchor === homeAnchor || nodes.length === 0) return undefined;
    const data = buildKinshipGraphFromApp({ nodes, relationships, anchorNodeId: homeAnchor });
    const homeGraph = resolveKinshipGraph({
      anchorNodeId: homeAnchor,
      nodes: data.nodes,
      edges: data.edges,
      options: { mode },
    });
    const target = homeGraph.nodes.find((n) => n.id === viewAnchor);
    if (!target) return undefined;
    return getRelationshipExplanation({
      anchorNodeId: homeAnchor,
      targetNodeId: viewAnchor,
      path: target.kinshipPathFromAnchor,
      nodes: homeGraph.nodes,
      edges: homeGraph.edges,
    });
  }, [homeAnchor, viewAnchor, nodes, relationships, mode]);

  if (!graph || !view) {
    return (
      <View style={{ alignItems: 'center', padding: spacing.xl }}>
        <Caption>Your Family Tree is just beginning.</Caption>
      </View>
    );
  }

  const anchorNode = view.visibleNodes.find((n) => n.id === viewAnchor) ?? null;
  const viewingFromOther = viewAnchor !== homeAnchor;
  const anchorDisplayName =
    nodes.find((n) => n.id === viewAnchor)?.displayName ?? anchorNode?.displayName ?? 'This person';

  const anchorExplanation =
    detailsOpen && anchorNode
      ? viewingFromOther
        ? homePerspectiveExplanation
        : 'This is your place in the Family Tree. Tap another light to view connections from their perspective.'
      : undefined;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height: h } = e.nativeEvent.layout;
    setContainer((prev) => (prev.w === width && prev.h === h ? prev : { w: width, h }));
  };

  const onPickSearchResult = (id: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    if (id !== viewAnchor) {
      onAnchorChange?.(id);
      setDetailsOpen(false);
    } else {
      setDetailsOpen(true);
    }
  };

  const onReturnHome = () => {
    if (!homeAnchor) return;
    onAnchorChange?.(homeAnchor);
    setDetailsOpen(false);
  };

  const onToggleMinimalView = () => {
    setMinimalView((v) => {
      const next = !v;
      if (next) {
        setSearchOpen(false);
        setSearchQuery('');
        setFilterOpen(false);
        setDetailsOpen(false);
      }
      onMinimalViewChange?.(next);
      return next;
    });
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
                  <FamilyTreeEdge key={edge.id} edge={edge} highlighted={false} />
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
                  highlighted={node.id === viewAnchor && detailsOpen}
                  minimalView={minimalView}
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

      {viewingFromOther && !minimalView ? (
        <Pressable
          onPress={onReturnHome}
          accessibilityRole="button"
          accessibilityLabel="View Family Tree from your perspective"
          style={({ pressed }) => ({
            position: 'absolute',
            left: spacing.sm,
            top: spacing.sm,
            zIndex: 2,
            backgroundColor: colors.paper,
            borderRadius: radii.pill,
            borderWidth: 1,
            borderColor: colors.softGold,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Caption style={{ color: colors.deepUmber, fontSize: 13 }}>
            Viewing from {anchorDisplayName.split(' ')[0]} · Return to me
          </Caption>
        </Pressable>
      ) : null}

      <CanvasControls
        orientation={orientation}
        filterActive={isFilterActive(filter)}
        minimalView={minimalView}
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
        onToggleMinimalView={onToggleMinimalView}
      />

      {onAddRelative && !minimalView ? (
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

      {searchOpen && !minimalView ? (
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
            searchResults.map((n) => {
              const fullName = (n.metadata as { fullName?: string } | undefined)?.fullName;
              return (
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
                  {fullName ? (
                    <Caption style={{ color: colors.deepUmber, fontSize: 12 }}>{fullName}</Caption>
                  ) : n.relationshipLabelFromAnchor ? (
                    <Caption style={{ color: colors.deepUmber, fontSize: 12 }}>
                      {n.relationshipLabelFromAnchor}
                    </Caption>
                  ) : null}
                </Pressable>
              );
            })
          )}
        </View>
      ) : null}

      {detailsOpen && anchorNode && !minimalView ? (
        <View style={{ position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md }}>
          <RelationshipTooltip
            name={anchorNode.displayName}
            label={viewingFromOther ? undefined : 'You'}
            explanation={anchorExplanation}
            onOpenProfile={
              appNodeIds.has(anchorNode.id) && onSelectNode ? () => onSelectNode(anchorNode.id) : undefined
            }
            onOpenMemorial={
              appNodeIds.has(anchorNode.id) &&
              (anchorNode.nodeType === 'deceased' ||
                anchorNode.status === 'memory_light' ||
                anchorNode.status === 'memorial_pending') &&
              onOpenMemorial
                ? () => onOpenMemorial(anchorNode.id)
                : undefined
            }
            onCompleteUnknown={
              anchorNode.nodeType === 'placeholder' && !appNodeIds.has(anchorNode.id) && onCompleteUnknown
                ? () => onCompleteUnknown(anchorNode)
                : undefined
            }
            onAddRelative={
              appNodeIds.has(anchorNode.id) && anchorNode.nodeType !== 'placeholder' && onAddRelativeFromNode
                ? () => onAddRelativeFromNode(anchorNode.id)
                : undefined
            }
            onClose={() => setDetailsOpen(false)}
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
        availableSurnames={availableSurnames}
      />
    </View>
  );
}
