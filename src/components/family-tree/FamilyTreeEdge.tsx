import { Path } from 'react-native-svg';
import { colors } from '@/constants/theme';
import type { LineStyle, RenderEdge } from '@/lib/kinship/types';

function strokeFor(style: LineStyle, highlighted: boolean): { stroke: string; width: number; dash?: string; opacity: number } {
  if (highlighted) return { stroke: colors.guardianGold, width: 3, opacity: 1 };
  switch (style) {
    case 'solid':
      return { stroke: colors.guardianGold, width: 2, opacity: 0.85 };
    case 'dashed':
      return { stroke: colors.guardianGold, width: 2, dash: '10,8', opacity: 0.85 };
    case 'dotted':
      return { stroke: colors.softGold, width: 2, dash: '1,7', opacity: 0.85 };
    case 'wavy':
      return { stroke: colors.softGold, width: 2, opacity: 0.85 };
    case 'muted':
      return { stroke: colors.ashTaupe, width: 1.5, dash: '4,6', opacity: 0.6 };
    case 'warning':
      return { stroke: colors.error, width: 2, dash: '8,6', opacity: 0.9 };
    case 'hidden':
    default:
      return { stroke: 'transparent', width: 0, opacity: 0 };
  }
}

/** Renders one relationship as an SVG path. Must be used inside an <Svg>. */
export function FamilyTreeEdge({ edge, highlighted = false }: { edge: RenderEdge; highlighted?: boolean }) {
  if (!edge.path || edge.lineStyle === 'hidden') return null;
  const s = strokeFor(edge.lineStyle, highlighted);
  return (
    <Path
      d={edge.path}
      stroke={s.stroke}
      strokeWidth={s.width}
      strokeDasharray={s.dash}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity={s.opacity}
    />
  );
}
