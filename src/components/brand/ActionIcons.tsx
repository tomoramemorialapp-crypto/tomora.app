import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { ColorValue } from 'react-native';

const SW = 1.6;

function Base({ children, size = 22 }: { children: React.ReactNode; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {children}
    </Svg>
  );
}

/** Share / link-out icon for opening the share sheet. */
export function ShareLinkIcon({ color, size = 22 }: { color: ColorValue; size?: number }) {
  return (
    <Base size={size}>
      <Path
        d="M9 8.5 15 4.5v15L9 15.5"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 6.5h4.5V11M19 17.5h-4.5V13"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Base>
  );
}

/** QR code icon for profile QR sheet. */
export function QrCodeIcon({ color, size = 22 }: { color: ColorValue; size?: number }) {
  return (
    <Base size={size}>
      <Rect x="4" y="4" width="7" height="7" rx="1.2" stroke={color} strokeWidth={SW} />
      <Rect x="13" y="4" width="7" height="7" rx="1.2" stroke={color} strokeWidth={SW} />
      <Rect x="4" y="13" width="7" height="7" rx="1.2" stroke={color} strokeWidth={SW} />
      <Path d="M13 13h2.5v2.5H13zM17.5 13H20v2.5h-2.5zM13 17.5h2.5V20H13zM17.5 17.5h2.5V20h-2.5z" fill={color} />
      <Circle cx="7.5" cy="7.5" r="1.1" fill={color} />
    </Base>
  );
}
