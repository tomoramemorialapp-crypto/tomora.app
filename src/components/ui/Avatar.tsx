import { Text, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Initials avatar in warm tones. Memorial nodes get a softer candlelight ring.
 */
export function Avatar({
  name,
  size = 56,
  memorial = false,
}: {
  name: string;
  size?: number;
  memorial?: boolean;
}) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={name}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: memorial ? colors.candlelight : colors.mistBeige,
        borderWidth: memorial ? 2 : 1,
        borderColor: memorial ? colors.softGold : colors.hairline,
      }}
    >
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
