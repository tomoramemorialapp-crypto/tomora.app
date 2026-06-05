import { View, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

const STAR = require('../../../assets/brand/star.png');

/**
 * The Tomora four-point gold star — the light/star motif used as accents and
 * as the gentle "add" affordance throughout the app. Renders the brand star
 * asset; pass `color` to tint it for a specific surface.
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
      <Image
        source={STAR}
        style={{ width: size, height: size }}
        contentFit="contain"
        tintColor={color}
        accessible={false}
      />
    </View>
  );
}
