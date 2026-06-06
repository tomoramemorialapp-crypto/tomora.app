import Svg, { Circle, Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';

import { colors } from '@/constants/theme';
import type { Notification } from '@/types/models';
import { GoldStar } from './GoldStar';
import { RemembranceIcon } from './OccasionIcons';

const SW = 1.6;

function Base({ children, size }: { children: React.ReactNode; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {children}
    </Svg>
  );
}

function NewMemberIcon({ color, size }: { color: ColorValue; size: number }) {
  return (
    <Base size={size}>
      <Circle cx={12} cy={8} r={3} stroke={color} strokeWidth={SW} />
      <Path d="M6 19c.8-2.8 3-4.5 6-4.5s5.2 1.7 6 4.5" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <Path d="M18 6.5l1.5 1.5M18 8l1.5-1.5" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  );
}

function InviteIcon({ color, size }: { color: ColorValue; size: number }) {
  return (
    <Base size={size}>
      <Path
        d="M5 7.5A1.5 1.5 0 0 1 6.5 6h11A1.5 1.5 0 0 1 19 7.5v9A1.5 1.5 0 0 1 17.5 18h-11A1.5 1.5 0 0 1 5 16.5v-9Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <Path d="M5 8l7 5 7-5" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
    </Base>
  );
}

function RequestIcon({ color, size }: { color: ColorValue; size: number }) {
  return (
    <Base size={size}>
      <Path d="M8 11.5h8M12 7.5v8" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <Circle cx={8} cy={11.5} r={3.2} stroke={color} strokeWidth={SW} />
      <Circle cx={16} cy={11.5} r={3.2} stroke={color} strokeWidth={SW} />
    </Base>
  );
}

function EditIcon({ color, size }: { color: ColorValue; size: number }) {
  return (
    <Base size={size}>
      <Path
        d="M14.5 5.5 18.5 9.5 9 19H5v-4L14.5 5.5Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <Path d="M13 7l2 2" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  );
}

function DisputeIcon({ color, size }: { color: ColorValue; size: number }) {
  return (
    <Base size={size}>
      <Path d="M8 5.5v13M16 5.5v13" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <Path d="M6 9.5h4M14 14.5h4" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  );
}

function AccessIcon({ color, size }: { color: ColorValue; size: number }) {
  return (
    <Base size={size}>
      <Path
        d="M8 11V8.5a4 4 0 1 1 8 0V11"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <Path
        d="M6.5 11h11a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 17.5v-5A1.5 1.5 0 0 1 6.5 11Z"
        stroke={color}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={15} r={1.1} fill={color} />
    </Base>
  );
}

/** Line-icon set for notification rows (matches tab icon weight). */
export function NotificationIcon({
  type,
  size = 22,
  color = colors.guardianGold,
}: {
  type: Notification['type'];
  size?: number;
  color?: ColorValue;
}) {
  switch (type) {
    case 'new_member':
      return <NewMemberIcon color={color} size={size} />;
    case 'invite':
      return <InviteIcon color={color} size={size} />;
    case 'request':
      return <RequestIcon color={color} size={size} />;
    case 'suggested_edit':
      return <EditIcon color={color} size={size} />;
    case 'dispute':
    case 'memorial_disputed':
      return <DisputeIcon color={color} size={size} />;
    case 'access':
      return <AccessIcon color={color} size={size} />;
    case 'memorial_pending':
    case 'memorial_created':
      return <RemembranceIcon color={color} size={size} />;
    case 'system':
    default:
      return <GoldStar size={size} color={String(color)} />;
  }
}
