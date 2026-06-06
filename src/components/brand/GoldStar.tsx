import { View, type ViewStyle } from 'react-native';
import { colors } from '@/constants/theme';
import StarSvg from '../../../assets/brand/gold-star.svg';

/**
 * The Tomora four-point gold star — the light/star motif used as accents and
 * as the gentle "add" affordance throughout the app. Renders the crisp vector
 * star; pass `color` to tint it for a specific surface.
 */
export function GoldStar({
  size = 16,
  color,
  style,
}: {
  size?: number;
  color?: string;
  style?: ViewStyle;
}) {
  return (
    <View
      accessible={false}
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <StarSvg width={size} height={size} color={color ?? colors.guardianGold} />
    </View>
  );
}
