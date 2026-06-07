/**
 * Tomora Kinship Engine (TKE) — core data model.
 *
 * These types are intentionally self-contained (no app/RN imports) so the
 * engine stays pure, deterministic, and unit-testable in isolation. The app's
 * domain models are converted into these via `adapter.ts`.
 */

export type NodeType = 'person' | 'baby' | 'elderly' | 'deceased' | 'pet' | 'placeholder';

export type NodeStatus =
  | 'placeholder'
  | 'invited'
  | 'claim_pending'
  | 'claimed'
  | 'managed'
  | 'memorial_pending'
  | 'memory_light'
  | 'disputed';

export type VisibilityLevel =
  | 'private'
  | 'selected'
  | 'relationship'
  | 'branch'
  | 'family_tree'
  | 'semi_private'
  | 'public';

export type BranchType =
  | 'self'
  | 'mother_side'
  | 'father_side'
  | 'partner_side'
  | 'chosen_family'
  | 'pet_companion'
  | 'unsorted';

export interface NodeLayout {
  x: number;
  y: number;
  layer: number;
  order: number;
  side?: 'left' | 'right' | 'center';
  clusterId?: string;
}

export interface KinshipNode {
  id: string;
  familyTreeId: string;
  accountId?: string;

  displayName: string;
  nodeType: NodeType;
  status: NodeStatus;

  birthDate?: string;
  deathDate?: string;
  isAnchor?: boolean;

  branchId?: string;
  branchType?: BranchType;

  visibility: VisibilityLevel;

  // Computed by engine
  generationOffset?: number;
  visualLayer?: number;
  relationshipLabelFromAnchor?: string;
  kinshipPathFromAnchor?: string[];

  layout?: NodeLayout;

  metadata?: Record<string, unknown>;
}

export type RelationshipEdgeType =
  | 'parent_child'
  | 'partnership'
  | 'sibling'
  | 'pet_owner'
  | 'guardian_managed'
  | 'friend'
  | 'chosen_family'
  | 'placeholder_bridge';

export type RelationshipStatus = 'confirmed' | 'pending' | 'rejected' | 'disputed' | 'inferred';

export type RelationshipDirection = 'up' | 'down' | 'same' | 'companion';

export interface RelationshipEdge {
  id: string;
  familyTreeId: string;

  fromNodeId: string;
  toNodeId: string;

  type: RelationshipEdgeType;
  status: RelationshipStatus;
  visibility: VisibilityLevel;

  direction?: RelationshipDirection;

  /** Optional semantic labels, e.g. "father", "mother", "owner", "partner". */
  fromRole?: string;
  toRole?: string;

  createdByAccountId?: string;
  approvedByNodeIds?: string[];

  metadata?: Record<string, unknown>;
}

export type LineStyle = 'solid' | 'dashed' | 'dotted' | 'wavy' | 'muted' | 'warning' | 'hidden';

export interface RenderNode extends KinshipNode {
  generationOffset: number;
  visualLayer: number;
  relationshipLabelFromAnchor: string;
  kinshipPathFromAnchor: string[];
  branchType: BranchType;
  layout: NodeLayout;
}

export interface RenderEdge extends RelationshipEdge {
  lineStyle: LineStyle;
  /** SVG path string computed by the edge router. */
  path?: string;
}

export interface FamilyUnit {
  id: string;
  familyTreeId: string;
  partnerNodeIds: string[];
  childNodeIds: string[];
  generationOffset: number;
  branchId?: string;
}

export interface KinshipWarning {
  code: string;
  message: string;
  nodeIds?: string[];
  edgeIds?: string[];
}

export type LayoutMode = 'focus' | 'branch' | 'full' | 'path' | 'household';

export interface KinshipRenderGraph {
  anchorNodeId: string;
  nodes: RenderNode[];
  edges: RenderEdge[];
  familyUnits: FamilyUnit[];
  warnings: KinshipWarning[];
}

export interface ResolveKinshipOptions {
  mode?: LayoutMode;
  branchType?: BranchType;
  maxGenerationsUp?: number;
  maxGenerationsDown?: number;
  includePrivatePlaceholders?: boolean;
  autoCreatePlaceholders?: boolean;
  /** When set, only this node is labelled "You" as the anchor; other anchors use display name only. */
  homeAnchorNodeId?: string;
  /** When set, layout, generations, and branches are computed from this node; labels still use anchorNodeId. */
  layoutAnchorNodeId?: string;
}

export interface ResolveKinshipInput {
  anchorNodeId: string;
  viewerAccountId?: string;
  nodes: KinshipNode[];
  edges: RelationshipEdge[];
  options?: ResolveKinshipOptions;
}
