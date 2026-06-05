import { View } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/constants/theme';

// Official Tomora crest — gold pine tree + light, on a transparent background.
const EMBLEM = require('../../../assets/brand/logo-emblem.png');

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
      <Image
        source={EMBLEM}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessible={false}
        transition={300}
      />
    </View>
  );
}
