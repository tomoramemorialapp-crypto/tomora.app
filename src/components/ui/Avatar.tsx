import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { colors, fonts } from '@/constants/theme';
import { useMediaUri } from '@/lib/mediaUri';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Avatar in warm tones. Renders an uploaded/linked photo when `uri` is set,
 * otherwise falls back to initials. Memorial nodes get a softer candlelight ring.
 */
export function Avatar({
  name,
  size = 56,
  memorial = false,
  uri,
}: {
  name: string;
  size?: number;
  memorial?: boolean;
  uri?: string;
}) {
  const resolvedUri = useMediaUri(uri);

  const ring = {
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: memorial ? colors.candlelight : colors.mistBeige,
    borderWidth: memorial ? 2 : 1,
    borderColor: memorial ? colors.softGold : colors.hairline,
    overflow: 'hidden' as const,
  };

  if (resolvedUri) {
    return (
      <View accessibilityRole="image" accessibilityLabel={name} style={ring}>
        <Image
          source={{ uri: resolvedUri }}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={150}
        />
      </View>
    );
  }

  return (
    <View accessibilityRole="image" accessibilityLabel={name} style={ring}>
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: size * 0.4,
          color: memorial ? colors.guardianGold : colors.deepUmber,
          fontWeight: '600',
        }}
      >
        {initials(name)}
      </Text>
    </View>
  );
}
