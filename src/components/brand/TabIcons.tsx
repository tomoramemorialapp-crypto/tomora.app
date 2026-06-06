import Svg, { Circle, Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';

/**
 * Tomora bottom-tab icon set. Consistent line style — a single 1.6px rounded
 * stroke on a 24×24 grid, no fills — so they read as one calm, elegant family
 * regardless of the active gold / inactive taupe tint.
 */

export type TabIconName = 'home' | 'tree' | 'memories' | 'occasions' | 'companion' | 'you';

const SW = 1.6;

function Base({ children, size = 24 }: { children: React.ReactNode; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {children}
    </Svg>
  );
}

/**
 * Notification bell in the same calm 1.6px line family as the tab icons, so the
 * header chrome reads as one set with the bottom navigation.
 */
export function BellIcon({ color, size = 22 }: { color: ColorValue; size?: number }) {
  return (
    <Base size={size}>
      <Path
        d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.4 2.1a.6.6 0 0 1-.5.9H5.6a.6.6 0 0 1-.5-.9l1.4-2.1Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M10 20.5a2 2 0 0 0 4 0" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 3.2v1.3" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  );
}

export function TabIcon({ name, color, focused }: { name: TabIconName; color: ColorValue; focused?: boolean }) {
  const stroke = color;
  const sw = focused ? SW + 0.3 : SW;
  switch (name) {
    case 'home':
      return (
        <Base>
          <Path
            d="M4 10.5 12 4l8 6.5"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M5.5 9.5V19a1 1 0 0 0 1 1H17.5a1 1 0 0 0 1-1V9.5"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M10 20v-4.5a2 2 0 0 1 4 0V20" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Base>
      );
    case 'tree':
      // A small lineage: one above, two below, joined — Tomora's connected light.
      return (
        <Base>
          <Circle cx={12} cy={5} r={2.4} stroke={stroke} strokeWidth={sw} />
          <Circle cx={6} cy={18.5} r={2.4} stroke={stroke} strokeWidth={sw} />
          <Circle cx={18} cy={18.5} r={2.4} stroke={stroke} strokeWidth={sw} />
          <Path
            d="M12 7.4v3.1m0 0c0 2-2 2.5-4 3.4m4-3.4c0 2 2 2.5 4 3.4"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Base>
      );
    case 'memories':
      // Four-point guardian star (brand motif) inside a soft frame.
      return (
        <Base>
          <Path
            d="M12 4c.4 3.4 1.2 4.2 4.6 4.6-3.4.4-4.2 1.2-4.6 4.6-.4-3.4-1.2-4.2-4.6-4.6C10.8 8.2 11.6 7.4 12 4Z"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <Path d="M17.5 14.5c.2 1.6.6 2 2.2 2.2-1.6.2-2 .6-2.2 2.2-.2-1.6-.6-2-2.2-2.2 1.6-.2 2-.6 2.2-2.2Z" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        </Base>
      );
    case 'occasions':
      // Calendar.
      return (
        <Base>
          <Path
            d="M5 6.5a1.5 1.5 0 0 1 1.5-1.5h11A1.5 1.5 0 0 1 19 6.5v11A1.5 1.5 0 0 1 17.5 19h-11A1.5 1.5 0 0 1 5 17.5v-11Z"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <Path d="M5 9h14M8.5 3.5v3M15.5 3.5v3" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <Circle cx={12} cy={13.5} r={1.1} fill={stroke} />
        </Base>
      );
    case 'companion':
      // A gentle guiding light / speech-glow.
      return (
        <Base>
          <Path
            d="M5 11.5C5 7.9 8 5.2 12 5.2s7 2.7 7 6.3-3 6.3-7 6.3a8 8 0 0 1-2.4-.36L5.8 19l.5-2.6A6 6 0 0 1 5 11.5Z"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <Path d="M12 8.6c.25 1.7.8 2.25 2.5 2.5-1.7.25-2.25.8-2.5 2.5-.25-1.7-.8-2.25-2.5-2.5C11.2 10.85 11.75 10.3 12 8.6Z" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        </Base>
      );
    case 'you':
      return (
        <Base>
          <Circle cx={12} cy={8.5} r={3.3} stroke={stroke} strokeWidth={sw} />
          <Path
            d="M5.5 19c.7-3.2 3.3-5 6.5-5s5.8 1.8 6.5 5"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Base>
      );
  }
}
