import { View } from 'react-native';
import { colors } from '@/constants/theme';
import EmblemSvg from '../../../assets/brand/gold-logo.svg';

/**
 * Tomora emblem. Renders the brand crest, optionally over a soft candlelight
 * halo so it glows warmly on any background (works on web and native).
 */
export function TomoraEmblem({ size = 96, glow = true }: { size?: number; glow?: boolean }) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Tomora emblem"
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      {glow ? (
        <View
          style={{
            position: 'absolute',
            width: size * 1.18,
            height: size * 1.18,
            borderRadius: size,
            backgroundColor: colors.candlelight,
            opacity: 0.55,
          }}
        />
      ) : null}
      <EmblemSvg width={size} height={size} />
    </View>
  );
}
