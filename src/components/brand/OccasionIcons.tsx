import Svg, { Circle, Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';

import { colors } from '@/constants/theme';
import type { OccasionKind } from '@/lib/occasions';
import { GoldStar } from './GoldStar';

const SW = 1.6;

function Base({ children, size }: { children: React.ReactNode; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {children}
    </Svg>
  );
}

/** Layered cake with a single candle — birthdays & celebrations of life. */
function BirthdayIcon({ color, size }: { color: ColorValue; size: number }) {
  return (
    <Base size={size}>
      <Path
        d="M6 14.5h12v4a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-4Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <Path
        d="M6 14.5c0-2.2 2.6-3.8 6-3.8s6 1.6 6 3.8"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <Path d="M12 6.8v4.2" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <Path
        d="M11.2 6.8c0 .9.4 1.4 1 1.4s1-.5 1-1.4"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Base>
  );
}

/** Tomora remembrance candle — memorials & death anniversaries. */
export function RemembranceIcon({ color, size = 22 }: { color?: ColorValue; size?: number }) {
  const stroke = color ?? colors.deepUmber;
  return (
    <Base size={size}>
      <Path
        d="M10.2 9h3.6v11.2a.7.7 0 0 1-.7.7h-2.2a.7.7 0 0 1-.7-.7V9Z"
        stroke={stroke}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <Path
        d="M12 4.8c1.1 1.3 1.5 2.1 1.5 3.1a1.5 1.5 0 1 1-3 0c0-1 .4-1.8 1.5-3.1Z"
        stroke={stroke}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <Path d="M9 20.8h6" stroke={stroke} strokeWidth={SW} strokeLinecap="round" opacity={0.45} />
    </Base>
  );
}

/** Interlocking rings — wedding anniversaries. */
function WeddingIcon({ color, size }: { color: ColorValue; size: number }) {
  return (
    <Base size={size}>
      <Circle cx={9.5} cy={12} r={4.6} stroke={color} strokeWidth={SW} />
      <Circle cx={14.5} cy={12} r={4.6} stroke={color} strokeWidth={SW} />
    </Base>
  );
}

export function occasionIconColor(kind: OccasionKind): string {
  if (kind === 'death_anniversary') return colors.deepUmber;
  return colors.guardianGold;
}

/** Brand-consistent occasion glyph (replaces emoji in cards & lists). */
export function OccasionIcon({
  kind,
  size = 22,
  color,
}: {
  kind: OccasionKind;
  size?: number;
  color?: ColorValue;
}) {
  const stroke = color ?? occasionIconColor(kind);
  switch (kind) {
    case 'birthday':
      return <BirthdayIcon color={stroke} size={size} />;
    case 'death_anniversary':
      return <RemembranceIcon color={stroke} size={size} />;
    case 'wedding_anniversary':
      return <WeddingIcon color={stroke} size={size} />;
    case 'holiday':
      return <GoldStar size={size} color={String(stroke)} />;
  }
}
