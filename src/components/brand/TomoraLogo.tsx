import { Text, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';
import { TomoraEmblem } from './TomoraEmblem';

/**
 * Elegant lowercase serif wordmark, optionally stacked with the emblem.
 */
export function TomoraLogo({
  size = 'md',
  layout = 'horizontal',
  showEmblem = true,
}: {
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical';
  showEmblem?: boolean;
}) {
  const wordSize = size === 'lg' ? 40 : size === 'sm' ? 22 : 30;
  const emblemSize = size === 'lg' ? 84 : size === 'sm' ? 30 : 48;
  const vertical = layout === 'vertical';

  return (
    <View
      accessibilityRole="header"
      accessibilityLabel="Tomora"
      style={{
        flexDirection: vertical ? 'column' : 'row',
        alignItems: 'center',
        gap: vertical ? 16 : 12,
      }}
    >
      {showEmblem ? <TomoraEmblem size={emblemSize} glow={size === 'lg'} /> : null}
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: wordSize,
          letterSpacing: 1,
          color: colors.ink,
          fontWeight: '500',
        }}
      >
        tomora
      </Text>
    </View>
  );
}
