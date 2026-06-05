import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, fonts, fontSize } from '@/constants/theme';

type Props = TextProps & { color?: string; align?: TextStyle['textAlign']; style?: TextStyle };

/** Serif display heading. */
export function Display({ color = colors.ink, align, style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[
        { fontFamily: fonts.display, fontSize: fontSize.h1, lineHeight: fontSize.h1 * 1.1, color, fontWeight: '600', textAlign: align },
        style,
      ]}
    />
  );
}

/** Serif title. */
export function Title({ color = colors.ink, align, style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[
        { fontFamily: fonts.display, fontSize: fontSize.h3, lineHeight: fontSize.h3 * 1.2, color, fontWeight: '600', textAlign: align },
        style,
      ]}
    />
  );
}

/** Body copy (sans, >=16px for accessibility). */
export function Body({ color = colors.charcoal, align, style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[
        { fontFamily: fonts.body, fontSize: fontSize.body, lineHeight: fontSize.body * 1.5, color, textAlign: align },
        style,
      ]}
    />
  );
}

/** Quiet caption. */
export function Caption({ color = colors.ashTaupe, align, style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[
        { fontFamily: fonts.body, fontSize: fontSize.caption, lineHeight: fontSize.caption * 1.4, color, letterSpacing: 0.3, textAlign: align },
        style,
      ]}
    />
  );
}
