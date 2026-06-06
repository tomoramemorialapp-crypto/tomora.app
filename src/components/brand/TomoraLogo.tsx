import { View } from 'react-native';
import { Image } from 'expo-image';
import { TomoraEmblem } from './TomoraEmblem';

// Official "tomora" wordmark — serif text with the gold star in place of the o.
const WORDMARK = require('../../../assets/brand/tomora-wordmark.png');
const WORDMARK_ASPECT = 300 / 46;

/**
 * Brand lockup: the official "tomora" wordmark image, optionally paired with the
 * tree emblem. The wordmark image is the supplementary text logo used wherever
 * the brand name is shown as text.
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
  const wordHeight = size === 'lg' ? 44 : size === 'sm' ? 22 : 32;
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
      <Image
        source={WORDMARK}
        style={{ height: wordHeight, width: wordHeight * WORDMARK_ASPECT }}
        contentFit="contain"
        accessible={false}
        transition={200}
      />
    </View>
  );
}
