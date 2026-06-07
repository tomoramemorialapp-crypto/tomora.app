import { View } from 'react-native';
import { colors } from '@/constants/theme';
import { TomoraEmblem } from './TomoraEmblem';
import WordmarkSvg from '../../../assets/brand/tomora-text.svg';

// Official "tomora" wordmark — serif text with the gold star in place of an o.
// Aspect matches the SVG viewBox (2626 × 400). The text uses `currentColor`
// so it adapts to the active theme; the inner star stays gold.
const WORDMARK_ASPECT = 2626 / 400;

/**
 * Brand lockup: the official "tomora" wordmark image, optionally paired with the
 * tree emblem. The wordmark image is the supplementary text logo used wherever
 * the brand name is shown as text.
 */
export function TomoraLogo({
  size = 'md',
  layout = 'horizontal',
  showEmblem = true,
  color = colors.ink,
  accessible = true,
}: {
  /** Named size preset, or an explicit wordmark height in px. */
  size?: 'sm' | 'md' | 'lg' | number;
  layout?: 'horizontal' | 'vertical';
  showEmblem?: boolean;
  /** Wordmark text color. Defaults to ink so it adapts to the active theme. */
  color?: string;
  /** When false, the wordmark is hidden from screen readers (e.g. when wrapped in a link). */
  accessible?: boolean;
}) {
  const wordHeight = typeof size === 'number' ? size : size === 'lg' ? 44 : size === 'sm' ? 22 : 32;
  const emblemSize = typeof size === 'number' ? size * 1.9 : size === 'lg' ? 84 : size === 'sm' ? 30 : 48;
  const vertical = layout === 'vertical';

  return (
    <View
      accessible={accessible}
      accessibilityRole={accessible ? 'header' : undefined}
      accessibilityLabel={accessible ? 'Tomora' : undefined}
      style={{
        flexDirection: vertical ? 'column' : 'row',
        alignItems: 'center',
        gap: vertical ? 16 : 12,
      }}
    >
      {showEmblem ? <TomoraEmblem size={emblemSize} glow={size === 'lg'} /> : null}
      <WordmarkSvg height={wordHeight} width={wordHeight * WORDMARK_ASPECT} color={color} />
    </View>
  );
}
