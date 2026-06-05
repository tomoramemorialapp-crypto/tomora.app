import { View, type ViewStyle } from 'react-native';
import { colors } from '@/constants/theme';

/**
 * A small four-point gold light — the star/light motif. Built from two rotated
 * diamonds so it stays crisp without an SVG dependency.
 */
export function GoldStar({
  size = 16,
  color = colors.guardianGold,
  style,
}: {
  size?: number;
  color?: string;
  style?: ViewStyle;
}) {
  const arm = size;
  const thickness = Math.max(2, size * 0.18);
  return (
    <View
      accessible={false}
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      {/* vertical beam */}
      <View
        style={{
          position: 'absolute',
          width: thickness,
          height: arm,
          backgroundColor: color,
          borderRadius: thickness,
        }}
      />
      {/* horizontal beam */}
      <View
        style={{
          position: 'absolute',
          width: arm,
          height: thickness,
          backgroundColor: color,
          borderRadius: thickness,
        }}
      />
    </View>
  );
}
