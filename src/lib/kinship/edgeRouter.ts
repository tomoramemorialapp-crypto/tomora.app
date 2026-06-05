import { LINE_STYLE_BY_EDGE_TYPE, NODE_RADIUS } from './constants';
import type { LineStyle, RelationshipEdge, RenderEdge, RenderNode } from './types';

/** Determine the visual line style from edge type + status + visibility. */
export function getLineStyle(edge: RelationshipEdge): LineStyle {
  if (edge.visibility === 'private') return 'hidden';
  if (edge.status === 'disputed') return 'warning';
  if (edge.status === 'pending' || edge.status === 'inferred') return 'muted';
  return LINE_STYLE_BY_EDGE_TYPE[edge.type] ?? 'dotted';
}

function cubicVertical(x1: number, y1: number, x2: number, y2: number): string {
  const midY = (y1 + y2) / 2;
  return `M ${r(x1)} ${r(y1)} C ${r(x1)} ${r(midY)}, ${r(x2)} ${r(midY)}, ${r(x2)} ${r(y2)}`;
}

function straight(x1: number, y1: number, x2: number, y2: number): string {
  return `M ${r(x1)} ${r(y1)} L ${r(x2)} ${r(y2)}`;
}

function wavy(x1: number, y1: number, x2: number, y2: number): string {
  const segments = 8;
  const amp = 7;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  // unit perpendicular
  const px = -dy / len;
  const py = dx / len;
  let d = `M ${r(x1)} ${r(y1)}`;
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const bx = x1 + dx * t;
    const by = y1 + dy * t;
    const offset = Math.sin(t * Math.PI * 4) * amp;
    d += ` L ${r(bx + px * offset)} ${r(by + py * offset)}`;
  }
  return d;
}

/**
 * Convert relationship edges into renderable SVG path strings + line styles,
 * using the laid-out node positions. Parent-child uses a soft vertical elbow,
 * partnerships/siblings draw horizontally, and pet bonds use a wavy line.
 */
export function routeEdges(params: { nodes: RenderNode[]; edges: RelationshipEdge[] }): RenderEdge[] {
  const { nodes, edges } = params;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const out: RenderEdge[] = [];

  for (const edge of edges) {
    const a = byId.get(edge.fromNodeId);
    const b = byId.get(edge.toNodeId);
    if (!a || !b) continue;

    const lineStyle = getLineStyle(edge);
    if (lineStyle === 'hidden') {
      out.push({ ...edge, lineStyle });
      continue;
    }

    const ax = a.layout.x;
    const ay = a.layout.y;
    const bx = b.layout.x;
    const by = b.layout.y;

    let path: string;
    if (edge.type === 'parent_child' || edge.type === 'placeholder_bridge') {
      // upper node = smaller y (higher on screen)
      const upper = ay <= by ? { x: ax, y: ay } : { x: bx, y: by };
      const lower = ay <= by ? { x: bx, y: by } : { x: ax, y: ay };
      path = cubicVertical(upper.x, upper.y + NODE_RADIUS, lower.x, lower.y - NODE_RADIUS);
    } else if (edge.type === 'pet_owner') {
      const upper = ay <= by ? { x: ax, y: ay } : { x: bx, y: by };
      const lower = ay <= by ? { x: bx, y: by } : { x: ax, y: ay };
      path = wavy(upper.x, upper.y + NODE_RADIUS, lower.x, lower.y - NODE_RADIUS);
    } else {
      // same-generation: connect along the nearest horizontal edges
      const left = ax <= bx ? { x: ax, y: ay } : { x: bx, y: by };
      const right = ax <= bx ? { x: bx, y: by } : { x: ax, y: ay };
      path = straight(left.x + NODE_RADIUS, left.y, right.x - NODE_RADIUS, right.y);
    }

    out.push({ ...edge, lineStyle, path });
  }

  return out;
}

function r(n: number): number {
  return Math.round(n * 100) / 100;
}
